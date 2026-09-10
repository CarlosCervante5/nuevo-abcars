<?php

namespace App\Services\CarWash\WhatsApp;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EvolutionApiWhatsAppGateway implements WhatsAppGatewayInterface
{
    public function provider(): string
    {
        return 'evolution';
    }

    public function isConfigured(): bool
    {
        $cfg = config('carwash.evolution');

        return filled($cfg['base_url'] ?? null)
            && filled($cfg['api_key'] ?? null)
            && filled($cfg['instance'] ?? null);
    }

    /**
     * @param  array{preferred_jid?: string|null}  $options
     * @return array{ok: bool, provider_message_id?: string|null, raw?: mixed, error?: string|null, delivery_status?: string|null, number_used?: string|null}
     */
    public function sendText(string $toPhone, string $body, array $options = []): array
    {
        if (! $this->isConfigured()) {
            return ['ok' => false, 'error' => 'Evolution API no configurada (EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE)'];
        }

        $state = $this->connectionState();
        if ($state !== null && $state !== 'open') {
            Log::warning('Evolution sendText blocked: instance not open', ['state' => $state]);

            return [
                'ok' => false,
                'error' => 'WhatsApp Evolution no está conectado (estado: '.$state.'). Escanea el QR en CarWash → Settings / Manager.',
                'connection_state' => $state,
            ];
        }

        $cfg = config('carwash.evolution');
        $candidates = [];

        $preferred = trim((string) ($options['preferred_jid'] ?? ''));
        if ($preferred !== '') {
            $candidates[] = $this->normalizeSendTarget($preferred);
        }

        $number = CarWashPhoneNormalizer::forEvolution($toPhone);
        if ($number !== '') {
            // En Evolution 2.3.7 / Baileys rc.9, a veces entrega mejor el @lid que el PN.
            // Probamos PN puro y también JID completo.
            $candidates[] = $number;
            $candidates[] = $number.'@s.whatsapp.net';

            $resolved = $this->resolveWhatsAppNumber($number);
            if (is_string($resolved) && $resolved !== '') {
                array_unshift($candidates, $resolved);
                if (! str_contains($resolved, '@')) {
                    $candidates[] = $resolved.'@s.whatsapp.net';
                }
            }
        }

        $candidates = array_values(array_unique(array_filter($candidates)));
        if ($candidates === []) {
            return ['ok' => false, 'error' => 'Teléfono destino inválido'];
        }

        $lastError = null;
        $lastRaw = null;
        foreach ($candidates as $target) {
            $result = $this->postSendText($target, $body);
            if ($result['ok'] ?? false) {
                $status = strtoupper((string) ($result['delivery_status'] ?? ''));
                // Si queda PENDING, intenta el siguiente candidato (p. ej. LID)
                if ($status === 'PENDING' && $target !== end($candidates)) {
                    Log::warning('Evolution sendText PENDING, trying next target', [
                        'target' => $target,
                        'message_id' => $result['provider_message_id'] ?? null,
                    ]);
                    $lastRaw = $result;
                    continue;
                }

                return $result;
            }
            $lastError = $result['error'] ?? 'send failed';
            $lastRaw = $result;
        }

        return [
            'ok' => false,
            'error' => is_string($lastError) ? $lastError : 'No se pudo entregar el mensaje',
            'raw' => $lastRaw['raw'] ?? $lastRaw,
        ];
    }

    /**
     * @return array{ok: bool, provider_message_id?: string|null, raw?: mixed, error?: string|null, delivery_status?: string|null, number_used?: string|null}
     */
    private function postSendText(string $number, string $body): array
    {
        $cfg = config('carwash.evolution');
        $url = $cfg['base_url'].'/message/sendText/'.$cfg['instance'];

        try {
            $response = Http::withHeaders([
                'apikey' => $cfg['api_key'],
                'Content-Type' => 'application/json',
            ])
                ->timeout((int) ($cfg['timeout'] ?? 30))
                ->post($url, [
                    'number' => $number,
                    'text' => $body,
                    'delay' => 1200,
                ]);

            $json = $response->json();
            if (! $response->successful()) {
                $error = is_array($json) ? ($json['message'] ?? $json['error'] ?? $response->body()) : $response->body();
                Log::warning('Evolution sendText failed', [
                    'status' => $response->status(),
                    'number' => $number,
                    'body' => $json,
                ]);

                return ['ok' => false, 'error' => is_string($error) ? $error : json_encode($error), 'raw' => $json];
            }

            $status = strtoupper((string) (data_get($json, 'status') ?? data_get($json, 'message.status') ?? ''));
            $messageId = data_get($json, 'key.id')
                ?? data_get($json, 'messageId')
                ?? data_get($json, 'id')
                ?? null;

            if ($status === 'PENDING') {
                Log::warning('Evolution sendText returned PENDING (posible no entrega)', [
                    'number' => $number,
                    'message_id' => $messageId,
                    'raw' => $json,
                ]);
            }

            return [
                'ok' => true,
                'provider_message_id' => $messageId ? (string) $messageId : null,
                'delivery_status' => $status ?: null,
                'number_used' => $number,
                'raw' => $json,
            ];
        } catch (\Throwable $e) {
            Log::error('Evolution sendText exception', ['message' => $e->getMessage(), 'number' => $number]);

            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    private function connectionState(): ?string
    {
        $cfg = config('carwash.evolution');
        try {
            $url = $cfg['base_url'].'/instance/connectionState/'.$cfg['instance'];
            $response = Http::withHeaders(['apikey' => $cfg['api_key']])
                ->timeout(10)
                ->get($url);
            if (! $response->successful()) {
                return null;
            }
            $json = $response->json();

            $state = data_get($json, 'instance.state') ?? data_get($json, 'state');

            return is_string($state) ? strtolower($state) : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function normalizeSendTarget(string $raw): string
    {
        $raw = trim($raw);
        if (str_contains($raw, '@lid') || str_contains($raw, '@s.whatsapp.net')) {
            return $raw;
        }

        return CarWashPhoneNormalizer::forEvolution($raw);
    }

    /**
     * Pregunta a Evolution si el número existe y devuelve dígitos/JID canónico.
     */
    private function resolveWhatsAppNumber(string $number): ?string
    {
        $cfg = config('carwash.evolution');
        $url = $cfg['base_url'].'/chat/whatsappNumbers/'.$cfg['instance'];

        try {
            $response = Http::withHeaders([
                'apikey' => $cfg['api_key'],
                'Content-Type' => 'application/json',
            ])
                ->timeout(min(15, (int) ($cfg['timeout'] ?? 30)))
                ->post($url, [
                    'numbers' => [$number],
                ]);

            if (! $response->successful()) {
                return null;
            }

            $json = $response->json();
            $rows = is_array($json) ? $json : [];
            if (isset($rows['data']) && is_array($rows['data'])) {
                $rows = $rows['data'];
            }

            foreach ($rows as $row) {
                if (! is_array($row)) {
                    continue;
                }
                $exists = $row['exists'] ?? $row['isWhatsapp'] ?? $row['numberExists'] ?? null;
                if ($exists === false) {
                    continue;
                }

                $jid = (string) ($row['jid'] ?? $row['number'] ?? '');
                if ($jid === '') {
                    continue;
                }

                // Preferir JID tal cual si es @lid (mejor entrega en Baileys rc.9)
                if (str_contains($jid, '@lid')) {
                    return $jid;
                }

                $resolved = CarWashPhoneNormalizer::forEvolution($jid);
                if ($resolved !== '') {
                    return $resolved;
                }
            }
        } catch (\Throwable $e) {
            Log::info('Evolution whatsappNumbers resolve skipped', ['message' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * Resuelve el teléfono real (PN) a partir de un JID @lid consultando Evolution.
     */
    public function resolvePhoneFromLid(string $lidJid): ?string
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $lidJid = trim($lidJid);
        if ($lidJid === '') {
            return null;
        }
        if (! str_contains($lidJid, '@')) {
            $lidJid .= '@lid';
        }

        $cfg = config('carwash.evolution');

        try {
            $url = $cfg['base_url'].'/chat/findMessages/'.$cfg['instance'];
            $response = Http::withHeaders([
                'apikey' => $cfg['api_key'],
                'Content-Type' => 'application/json',
            ])
                ->timeout(15)
                ->post($url, [
                    'where' => ['key' => ['remoteJid' => $lidJid]],
                    'page' => 1,
                    'offset' => 5,
                ]);

            if ($response->successful()) {
                $json = $response->json();
                $msgs = data_get($json, 'messages.records')
                    ?? data_get($json, 'messages')
                    ?? (is_array($json) ? $json : []);
                if (is_array($msgs)) {
                    foreach ($msgs as $m) {
                        if (! is_array($m)) {
                            continue;
                        }
                        $key = is_array($m['key'] ?? null) ? $m['key'] : [];
                        $alt = (string) ($key['remoteJidAlt'] ?? '');
                        if ($alt !== '' && ! str_contains($alt, '@lid')) {
                            $phone = CarWashPhoneNormalizer::e164($alt);
                            if ($phone !== '' && ! CarWashPhoneNormalizer::looksLikeLidDigits($phone)) {
                                return $phone;
                            }
                        }
                    }
                }
            }

            $chatsUrl = $cfg['base_url'].'/chat/findChats/'.$cfg['instance'];
            $chatsRes = Http::withHeaders([
                'apikey' => $cfg['api_key'],
                'Content-Type' => 'application/json',
            ])
                ->timeout(20)
                ->post($chatsUrl, []);

            if ($chatsRes->successful()) {
                $chats = $chatsRes->json();
                if (is_array($chats)) {
                    foreach ($chats as $chat) {
                        if (! is_array($chat) || ($chat['remoteJid'] ?? '') !== $lidJid) {
                            continue;
                        }
                        $alt = (string) data_get($chat, 'lastMessage.key.remoteJidAlt', '');
                        if ($alt !== '' && ! str_contains($alt, '@lid')) {
                            $phone = CarWashPhoneNormalizer::e164($alt);
                            if ($phone !== '' && ! CarWashPhoneNormalizer::looksLikeLidDigits($phone)) {
                                return $phone;
                            }
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::info('Evolution resolvePhoneFromLid failed', ['lid' => $lidJid, 'message' => $e->getMessage()]);
        }

        return null;
    }
}
