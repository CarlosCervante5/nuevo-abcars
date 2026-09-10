<?php

namespace App\Http\Controllers\CarWash;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Services\CarWash\CarWashSettingsService;
use App\Services\CarWash\WhatsApp\WhatsAppGatewayResolver;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CarWashWhatsAppSettingsController extends Controller
{
    public function show(CarWashSettingsService $settings, WhatsAppGatewayResolver $gateways)
    {
        try {
            $settings->applyRuntime();
            $gateway = $gateways->default();
            $payload = $settings->publicWhatsappPayload();
            $payload['status'] = [
                'provider' => $gateway->provider(),
                'configured' => $gateway->isConfigured(),
                'agent_enabled' => (bool) config('carwash.agent.enabled', true),
            ];

            if ($gateway->provider() === 'evolution') {
                // No tumbar settings si Evolution no responde
                try {
                    $payload['connection'] = $settings->evolutionConnectionState();
                } catch (\Throwable $e) {
                    $payload['connection'] = [
                        'ok' => false,
                        'state' => null,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            return ApiResponseHelper::apiSuccess(200, 'Settings WhatsApp CarWash', $payload);
        } catch (\Throwable $e) {
            return ApiResponseHelper::apiError('No se pudieron cargar settings', $e->getMessage(), 500, 'CARWASH_WA_SETTINGS_SHOW');
        }
    }

    public function update(Request $request, CarWashSettingsService $settings, WhatsAppGatewayResolver $gateways)
    {
        try {
            $data = $request->validate([
                'whatsapp_provider' => 'sometimes|string|in:evolution,twilio',
                'evolution' => 'sometimes|array',
                'evolution.base_url' => 'nullable|string|max:500',
                'evolution.api_key' => 'nullable|string|max:500',
                'evolution.instance' => 'nullable|string|max:120',
                'evolution.webhook_secret' => 'nullable|string|max:255',
                'evolution.timeout' => 'nullable|integer|min:5|max:120',
                'twilio' => 'sometimes|array',
                'twilio.account_sid' => 'nullable|string|max:120',
                'twilio.auth_token' => 'nullable|string|max:255',
                'twilio.from' => 'nullable|string|max:64',
                'twilio.webhook_secret' => 'nullable|string|max:255',
                'twilio.timeout' => 'nullable|integer|min:5|max:120',
                'agent' => 'sometimes|array',
                'agent.enabled' => 'nullable|boolean',
                'agent.history_limit' => 'nullable|integer|min:1|max:50',
                'agent.model' => 'nullable|string|max:80',
                'agent.openai_api_key' => 'nullable|string|max:500',
                'public_whatsapp_phone' => 'nullable|string|max:32',
            ]);

            $settings->saveWhatsapp($data);
            $gateway = $gateways->default();
            $payload = $settings->publicWhatsappPayload();
            $payload['status'] = [
                'provider' => $gateway->provider(),
                'configured' => $gateway->isConfigured(),
                'agent_enabled' => (bool) config('carwash.agent.enabled', true),
            ];

            return ApiResponseHelper::apiSuccess(200, 'Settings WhatsApp guardados', $payload);
        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Throwable $e) {
            return ApiResponseHelper::apiError('No se pudieron guardar settings', $e->getMessage(), 500, 'CARWASH_WA_SETTINGS');
        }
    }

    public function connection(CarWashSettingsService $settings)
    {
        try {
            $settings->applyRuntime();
            $result = $settings->evolutionConnectionState();

            return ApiResponseHelper::apiSuccess(200, 'Estado conexión Evolution', $result);
        } catch (\Throwable $e) {
            return ApiResponseHelper::apiSuccess(200, 'Estado conexión Evolution', [
                'ok' => false,
                'state' => null,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function qr(CarWashSettingsService $settings)
    {
        try {
            $settings->applyRuntime();
            $result = $settings->evolutionConnectQr();

            return ApiResponseHelper::apiSuccess(200, 'QR Evolution', $result);
        } catch (\Throwable $e) {
            return ApiResponseHelper::apiError('No se pudo obtener el QR', $e->getMessage(), 500, 'CARWASH_WA_QR');
        }
    }

    /**
     * Contacto público para CTAs de agendar (sin auth).
     */
    public function publicContact(CarWashSettingsService $settings)
    {
        try {
            $settings->applyRuntime();
            $cfg = $settings->whatsappConfig();
            $raw = (string) ($cfg['public_whatsapp_phone'] ?? '');
            $digits = preg_replace('/\D+/', '', $raw) ?? '';

            if ($digits === '') {
                $digits = preg_replace('/\D+/', '', (string) env('CARWASH_PUBLIC_WHATSAPP_PHONE', '5215646531805')) ?? '';
            }

            // México: wa.me necesita 521 + 10 dígitos (si no, el chat queda con 1 palomita)
            $digits = \App\Services\CarWash\WhatsApp\CarWashPhoneNormalizer::forEvolution($digits);

            $prefill = 'Hola AB CarWash, quiero agendar un lavado.';
            $display = null;
            $url = null;
            if ($digits !== '') {
                if (preg_match('/^521\d{10}$/', $digits) || preg_match('/^52\d{10}$/', $digits)) {
                    $local = substr($digits, -10);
                    $display = '+52 '.substr($local, 0, 3).' '.substr($local, 3, 3).' '.substr($local, 6, 4);
                } else {
                    $display = '+'.$digits;
                }
                $url = 'https://wa.me/'.$digits.'?text='.rawurlencode($prefill);
            }

            return ApiResponseHelper::apiSuccess(200, 'Contacto público CarWash', [
                'phone_digits' => $digits ?: null,
                // Marcar sin el "1" de WhatsApp (llamadas usan +52 + 10 locales)
                'phone_tel' => $digits
                    ? ('tel:+'.(preg_match('/^521(\d{10})$/', $digits, $m) ? '52'.$m[1] : $digits))
                    : null,
                'phone_display' => $display,
                'whatsapp_url' => $url,
                'prefill' => $prefill,
            ]);
        } catch (\Throwable $e) {
            return ApiResponseHelper::apiError('No se pudo cargar contacto CarWash', $e->getMessage(), 500, 'CARWASH_PUBLIC_CONTACT');
        }
    }
}
