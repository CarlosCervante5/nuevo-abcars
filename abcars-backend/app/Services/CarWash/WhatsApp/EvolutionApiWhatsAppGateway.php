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
        $number = CarWashPhoneNormalizer::digits($toPhone);
        if ($number === '') {
            return ['ok' => false, 'error' => 'Teléfono destino inválido'];
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
                ]);

            $json = $response->json();
            if (! $response->successful()) {
                $error = is_array($json) ? ($json['message'] ?? $json['error'] ?? $response->body()) : $response->body();
                Log::warning('Evolution sendText failed', ['status' => $response->status(), 'body' => $json]);

                return ['ok' => false, 'error' => is_string($error) ? $error : json_encode($error), 'raw' => $json];
            }

            $messageId = data_get($json, 'key.id')
                ?? data_get($json, 'messageId')
                ?? data_get($json, 'id')
                ?? null;

            return [
                'ok' => true,
                'provider_message_id' => $messageId ? (string) $messageId : null,
                'raw' => $json,
            ];
        } catch (\Throwable $e) {
            Log::error('Evolution sendText exception', ['message' => $e->getMessage()]);

            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }
}
