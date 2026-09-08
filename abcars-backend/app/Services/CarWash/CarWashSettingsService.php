<?php

namespace App\Services\CarWash;

use App\Models\CarWash\CarWashSetting;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CarWashSettingsService
{
    public const KEY_WHATSAPP = 'whatsapp';

    /**
     * Asegura tabla de settings (útil en sandbox tras deploy).
     */
    public function ensureTable(): void
    {
        if (CarWashSetting::tableReady()) {
            return;
        }

        try {
            Artisan::call('migrate', [
                '--force' => true,
                '--path' => 'database/migrations/2026_09_08_140000_create_carwash_settings_table.php',
            ]);
        } catch (\Throwable $e) {
            Log::warning('CarWash settings migrate failed', ['message' => $e->getMessage()]);
        }
    }

    /**
     * Config efectiva: .env/config + overrides guardados en BD.
     */
    public function whatsappConfig(): array
    {
        $this->ensureTable();

        $defaults = [
            'whatsapp_provider' => (string) config('carwash.whatsapp_provider', 'evolution'),
            'evolution' => [
                'base_url' => (string) config('carwash.evolution.base_url', ''),
                'api_key' => (string) config('carwash.evolution.api_key', ''),
                'instance' => (string) config('carwash.evolution.instance', ''),
                'webhook_secret' => (string) config('carwash.evolution.webhook_secret', ''),
                'timeout' => (int) config('carwash.evolution.timeout', 30),
            ],
            'twilio' => [
                'account_sid' => (string) config('carwash.twilio.account_sid', ''),
                'auth_token' => (string) config('carwash.twilio.auth_token', ''),
                'from' => (string) config('carwash.twilio.from', ''),
                'webhook_secret' => (string) config('carwash.twilio.webhook_secret', ''),
                'timeout' => (int) config('carwash.twilio.timeout', 30),
            ],
            'agent' => [
                'enabled' => (bool) config('carwash.agent.enabled', true),
                'history_limit' => (int) config('carwash.agent.history_limit', 12),
                'model' => (string) config('carwash.agent.model', 'gpt-4o-mini'),
            ],
            'public_whatsapp_phone' => '',
        ];

        $stored = CarWashSetting::getJson(self::KEY_WHATSAPP, []);

        return array_replace_recursive($defaults, $this->stripEmptyStrings($stored));
    }

    /**
     * Aplica overrides al contenedor de config (gateways / webhooks leen config()).
     */
    public function applyRuntime(): void
    {
        $cfg = $this->whatsappConfig();
        config([
            'carwash.whatsapp_provider' => $cfg['whatsapp_provider'],
            'carwash.evolution' => $cfg['evolution'],
            'carwash.twilio' => $cfg['twilio'],
            'carwash.agent' => $cfg['agent'],
        ]);
    }

    public function saveWhatsapp(array $input): array
    {
        $current = CarWashSetting::getJson(self::KEY_WHATSAPP, []);
        $merged = array_replace_recursive($current, $input);

        // Secretos: si mandan vacío / placeholder, conservar el valor previo (BD o env).
        $merged = $this->preserveSecrets($merged, $current);

        CarWashSetting::putJson(self::KEY_WHATSAPP, $merged);
        $this->applyRuntime();

        return $this->whatsappConfig();
    }

    /**
     * Payload seguro para el admin (secrets enmascarados).
     */
    public function publicWhatsappPayload(): array
    {
        $cfg = $this->whatsappConfig();

        return [
            'whatsapp_provider' => $cfg['whatsapp_provider'],
            'evolution' => [
                'base_url' => $cfg['evolution']['base_url'] ?? '',
                'api_key' => $this->maskSecret((string) ($cfg['evolution']['api_key'] ?? '')),
                'api_key_set' => filled($cfg['evolution']['api_key'] ?? null),
                'instance' => $cfg['evolution']['instance'] ?? '',
                'webhook_secret' => $this->maskSecret((string) ($cfg['evolution']['webhook_secret'] ?? '')),
                'webhook_secret_set' => filled($cfg['evolution']['webhook_secret'] ?? null),
                'timeout' => (int) ($cfg['evolution']['timeout'] ?? 30),
            ],
            'twilio' => [
                'account_sid' => $cfg['twilio']['account_sid'] ?? '',
                'auth_token' => $this->maskSecret((string) ($cfg['twilio']['auth_token'] ?? '')),
                'auth_token_set' => filled($cfg['twilio']['auth_token'] ?? null),
                'from' => $cfg['twilio']['from'] ?? '',
                'webhook_secret' => $this->maskSecret((string) ($cfg['twilio']['webhook_secret'] ?? '')),
                'webhook_secret_set' => filled($cfg['twilio']['webhook_secret'] ?? null),
                'timeout' => (int) ($cfg['twilio']['timeout'] ?? 30),
            ],
            'agent' => [
                'enabled' => (bool) ($cfg['agent']['enabled'] ?? true),
                'history_limit' => (int) ($cfg['agent']['history_limit'] ?? 12),
                'model' => (string) ($cfg['agent']['model'] ?? 'gpt-4o-mini'),
            ],
            'public_whatsapp_phone' => (string) ($cfg['public_whatsapp_phone'] ?? ''),
            'webhook_urls' => [
                'evolution' => rtrim((string) config('app.url'), '/').'/api/webhooks/evolution/whatsapp',
                'twilio' => rtrim((string) config('app.url'), '/').'/api/webhooks/twilio/whatsapp',
            ],
        ];
    }

    public function evolutionConnectionState(): array
    {
        $this->applyRuntime();
        $cfg = config('carwash.evolution');
        if (! filled($cfg['base_url'] ?? null) || ! filled($cfg['api_key'] ?? null) || ! filled($cfg['instance'] ?? null)) {
            return ['ok' => false, 'error' => 'Evolution no configurada', 'state' => null];
        }

        try {
            $url = rtrim($cfg['base_url'], '/').'/instance/connectionState/'.$cfg['instance'];
            $response = Http::withHeaders(['apikey' => $cfg['api_key']])
                ->timeout((int) ($cfg['timeout'] ?? 30))
                ->get($url);
            $json = $response->json();

            if (! $response->successful()) {
                return [
                    'ok' => false,
                    'error' => is_array($json) ? ($json['message'] ?? $response->body()) : $response->body(),
                    'state' => data_get($json, 'instance.state') ?? data_get($json, 'state'),
                    'raw' => $json,
                ];
            }

            return [
                'ok' => true,
                'state' => data_get($json, 'instance.state') ?? data_get($json, 'state') ?? 'unknown',
                'raw' => $json,
            ];
        } catch (\Throwable $e) {
            Log::warning('Evolution connectionState failed', ['message' => $e->getMessage()]);

            return ['ok' => false, 'error' => $e->getMessage(), 'state' => null];
        }
    }

    /**
     * Solicita QR / pairing code a Evolution (GET /instance/connect/{instance}).
     */
    public function evolutionConnectQr(): array
    {
        $this->applyRuntime();
        $cfg = config('carwash.evolution');
        if (! filled($cfg['base_url'] ?? null) || ! filled($cfg['api_key'] ?? null) || ! filled($cfg['instance'] ?? null)) {
            return ['ok' => false, 'error' => 'Evolution no configurada', 'base64' => null, 'pairing_code' => null];
        }

        try {
            $url = rtrim($cfg['base_url'], '/').'/instance/connect/'.$cfg['instance'];
            $response = Http::withHeaders(['apikey' => $cfg['api_key']])
                ->timeout((int) ($cfg['timeout'] ?? 30))
                ->get($url);
            $json = $response->json();

            if (! $response->successful()) {
                $error = is_array($json)
                    ? ($json['message'] ?? $json['error'] ?? $response->body())
                    : $response->body();

                return [
                    'ok' => false,
                    'error' => is_string($error) ? $error : json_encode($error),
                    'base64' => null,
                    'pairing_code' => null,
                    'raw' => $json,
                ];
            }

            $base64 = data_get($json, 'base64')
                ?? data_get($json, 'qrcode.base64')
                ?? data_get($json, 'qr.base64')
                ?? null;

            if (is_string($base64) && $base64 !== '' && ! str_starts_with($base64, 'data:')) {
                $base64 = 'data:image/png;base64,'.$base64;
            }

            $pairing = data_get($json, 'pairingCode')
                ?? data_get($json, 'pairing_code')
                ?? null;

            $code = data_get($json, 'code');
            // Algunas versiones solo devuelven `code` (string QR crudo) sin base64
            if ((! is_string($base64) || $base64 === '') && is_string($code) && str_starts_with($code, 'data:image')) {
                $base64 = $code;
            }

            $state = data_get($json, 'instance.state')
                ?? data_get($json, 'instance.status')
                ?? data_get($json, 'state')
                ?? null;

            if ((! is_string($base64) || $base64 === '') && ! filled($pairing) && $state === 'open') {
                return [
                    'ok' => true,
                    'already_connected' => true,
                    'state' => 'open',
                    'base64' => null,
                    'pairing_code' => null,
                    'error' => null,
                    'raw' => $json,
                ];
            }

            if ((! is_string($base64) || $base64 === '') && ! filled($pairing)) {
                return [
                    'ok' => false,
                    'error' => 'Evolution no devolvió QR. Revisa instancia o abre el Manager.',
                    'base64' => null,
                    'pairing_code' => null,
                    'state' => $state,
                    'raw' => $json,
                ];
            }

            return [
                'ok' => true,
                'already_connected' => false,
                'state' => $state ?: 'connecting',
                'base64' => is_string($base64) ? $base64 : null,
                'pairing_code' => $pairing ? (string) $pairing : null,
                'error' => null,
                'raw' => $json,
            ];
        } catch (\Throwable $e) {
            Log::warning('Evolution connect QR failed', ['message' => $e->getMessage()]);

            return [
                'ok' => false,
                'error' => $e->getMessage(),
                'base64' => null,
                'pairing_code' => null,
            ];
        }
    }

    private function preserveSecrets(array $merged, array $currentStored): array
    {
        $effective = $this->whatsappConfig();

        foreach (['api_key', 'webhook_secret'] as $secret) {
            $incoming = $merged['evolution'][$secret] ?? null;
            if ($this->shouldKeepSecret($incoming)) {
                $merged['evolution'][$secret] = $currentStored['evolution'][$secret]
                    ?? ($effective['evolution'][$secret] ?? '');
                // Si no hay valor en BD, no guardar vacío: omitir clave para seguir leyendo env
                if (($merged['evolution'][$secret] ?? '') === '' && ! isset($currentStored['evolution'][$secret])) {
                    unset($merged['evolution'][$secret]);
                }
            }
        }

        foreach (['auth_token', 'webhook_secret'] as $secret) {
            $incoming = $merged['twilio'][$secret] ?? null;
            if ($this->shouldKeepSecret($incoming)) {
                $merged['twilio'][$secret] = $currentStored['twilio'][$secret]
                    ?? ($effective['twilio'][$secret] ?? '');
                if (($merged['twilio'][$secret] ?? '') === '' && ! isset($currentStored['twilio'][$secret])) {
                    unset($merged['twilio'][$secret]);
                }
            }
        }

        return $merged;
    }

    private function shouldKeepSecret(mixed $incoming): bool
    {
        if (! is_string($incoming) || $incoming === '') {
            return true;
        }

        // Valores enmascarados del GET (••••xx)
        return str_starts_with($incoming, '••••') || str_contains($incoming, '****');
    }

    private function maskSecret(string $value): string
    {
        if ($value === '') {
            return '';
        }
        $tail = substr($value, -4);

        return '••••'.$tail;
    }

    private function stripEmptyStrings(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->stripEmptyStrings($value);
            } elseif ($value === null || $value === '') {
                unset($data[$key]);
            }
        }

        return $data;
    }
}
