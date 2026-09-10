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

    public function sendText(string $toPhone, string $body): array
    {
        if (! $this->isConfigured()) {
            return ['ok' => false, 'error' => 'Evolution API no configurada (EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE)'];
        }

        $cfg = config('carwash.evolution');
        $number = CarWashPhoneNormalizer::forEvolution($toPhone);
        if ($number === '') {
            return ['ok' => false, 'error' => 'Teléfono destino inválido'];
        }

        // Resuelve JID real en Evolution (evita PENDING / una sola palomita)
        $resolved = $this->resolveWhatsAppNumber($number);
        if (is_string($resolved) && $resolved !== '') {
            $number = $resolved;
        }

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
                    // Pequeño delay ayuda a que Baileys complete el handshake de entrega
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

    /**
     * Pregunta a Evolution si el número existe y devuelve dígitos del JID canónico.
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
            // Algunas versiones envuelven en data
            if (isset($rows['data']) && is_array($rows['data'])) {
                $rows = $rows['data'];
            }

            foreach ($rows as $row) {
                if (! is_array($row)) {
                    continue;
                }
                $exists = $row['exists'] ?? $row['isWhatsapp'] ?? $row['numberExists'] ?? null;
                if ($exists === false) {
                    Log::warning('Evolution: número no tiene WhatsApp', ['number' => $number, 'row' => $row]);

                    continue;
                }

                $jid = (string) ($row['jid'] ?? $row['number'] ?? '');
                if ($jid === '') {
                    continue;
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
}
