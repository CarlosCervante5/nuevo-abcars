<?php

namespace App\Services\CarWash\WhatsApp;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TwilioWhatsAppGateway implements WhatsAppGatewayInterface
{
    public function provider(): string
    {
        return 'twilio';
    }

    public function isConfigured(): bool
    {
        $cfg = config('carwash.twilio');

        return filled($cfg['account_sid'] ?? null)
            && filled($cfg['auth_token'] ?? null)
            && filled($cfg['from'] ?? null);
    }

    public function sendText(string $toPhone, string $body): array
    {
        if (! $this->isConfigured()) {
            return ['ok' => false, 'error' => 'Twilio no configurado'];
        }

        $cfg = config('carwash.twilio');
        $to = CarWashPhoneNormalizer::forTwilio($toPhone);
        $from = $cfg['from'];
        if (! str_starts_with(strtolower($from), 'whatsapp:')) {
            $from = 'whatsapp:'.$from;
        }

        if ($to === '') {
            return ['ok' => false, 'error' => 'Teléfono destino inválido'];
        }

        $url = sprintf(
            'https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json',
            $cfg['account_sid']
        );

        try {
            $response = Http::withBasicAuth($cfg['account_sid'], $cfg['auth_token'])
                ->asForm()
                ->timeout((int) ($cfg['timeout'] ?? 30))
                ->post($url, [
                    'From' => $from,
                    'To' => $to,
                    'Body' => $body,
                ]);

            $json = $response->json();
            if (! $response->successful()) {
                $error = is_array($json) ? ($json['message'] ?? $response->body()) : $response->body();
                Log::warning('Twilio WhatsApp send failed', ['status' => $response->status(), 'body' => $json]);

                return ['ok' => false, 'error' => is_string($error) ? $error : json_encode($error), 'raw' => $json];
            }

            return [
                'ok' => true,
                'provider_message_id' => $json['sid'] ?? null,
                'raw' => $json,
            ];
        } catch (\Throwable $e) {
            Log::error('Twilio WhatsApp send exception', ['message' => $e->getMessage()]);

            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }
}
