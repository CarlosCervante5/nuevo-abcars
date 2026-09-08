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
}
