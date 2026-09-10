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
            $candidates[] = $number;
        }

        $candidates = array_values(array_unique(array_filter($candidates)));
        if ($candidates === []) {
            return ['ok' => false, 'error' => 'Teléfono destino inválido'];
        }

        // UN solo intento de envío. Reintentar tras PENDING duplicaba el mismo texto
        // (loop de 3–4 mensajes idénticos con una palomita).
        $target = $candidates[0];
        $result = $this->postSendText($target, $body);
        if ($result['ok'] ?? false) {
            return $result;
        }

        // Solo si falló de verdad (no PENDING), probar el siguiente candidato una vez
        if (count($candidates) > 1) {
            $fallback = $candidates[1];
            Log::info('Evolution sendText retry with fallback target', [
                'from' => $target,
                'to' => $fallback,
                'error' => $result['error'] ?? null,
            ]);

            return $this->postSendText($fallback, $body);
        }

        return $result;
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
        $cacheKey = 'carwash-evo:connection-state';
        $cached = cache()->get($cacheKey);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $cfg = config('carwash.evolution');
        try {
            $url = $cfg['base_url'].'/instance/connectionState/'.$cfg['instance'];
            $response = Http::withHeaders(['apikey' => $cfg['api_key']])
                ->timeout(5)
                ->get($url);
            if (! $response->successful()) {
                return null;
            }
            $json = $response->json();

            $state = data_get($json, 'instance.state') ?? data_get($json, 'state');
            $normalized = is_string($state) ? strtolower($state) : null;
            if ($normalized !== null) {
                // Cache corto: evita +200–500ms por cada reply
                cache()->put($cacheKey, $normalized, now()->addSeconds(45));
            }

            return $normalized;
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
                ->timeout(8)
                ->post($url, [
                    'where' => ['key' => ['remoteJid' => $lidJid]],
                    'page' => 1,
                    'offset' => 3,
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

            // 2) Chat metadata omitido a propósito: findChats completo es muy lento.
            // Si no hay remoteJidAlt en mensajes recientes, devolvemos null.
        } catch (\Throwable $e) {
            Log::info('Evolution resolvePhoneFromLid failed', ['lid' => $lidJid, 'message' => $e->getMessage()]);
        }

        return null;
    }
}
