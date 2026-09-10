<?php

namespace App\Http\Controllers\CarWash;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Services\CarWash\WhatsApp\CarWashPhoneNormalizer;
use App\Services\CarWash\WhatsApp\CarWashWhatsAppInboundService;
use App\Services\CarWash\WhatsApp\WhatsAppGatewayResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CarWashWhatsAppWebhookController extends Controller
{
    public function evolution(Request $request)
    {
        if (! $this->authorizeEvolution($request)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $event = strtolower((string) $request->input('event', ''));
        $data = $request->input('data');

        // Algunos deployments envían el payload directo en root
        if (! is_array($data) && $request->has('key')) {
            $data = $request->all();
            $event = $event ?: 'messages.upsert';
        }

        if (! is_array($data)) {
            return response()->json(['ok' => true, 'skipped' => 'no_data']);
        }

        $normalizedEvent = str_replace(['_', '-'], '.', $event);
        if ($event !== '' && ! str_contains($normalizedEvent, 'messages.upsert') && $event !== 'MESSAGES_UPSERT') {
            return response()->json(['ok' => true, 'skipped' => 'event', 'event' => $event]);
        }

        $key = is_array($data['key'] ?? null) ? $data['key'] : [];
        if (($key['fromMe'] ?? false) === true) {
            return response()->json(['ok' => true, 'skipped' => 'fromMe']);
        }

        $remoteJid = (string) ($key['remoteJid'] ?? '');
        if ($remoteJid === '' || str_contains($remoteJid, '@g.us') || str_contains($remoteJid, '@broadcast')) {
            return response()->json(['ok' => true, 'skipped' => 'jid']);
        }

        $message = $data['message'] ?? [];
        $body = $message['conversation']
            ?? ($message['extendedTextMessage']['text'] ?? null)
            ?? ($message['imageMessage']['caption'] ?? null)
            ?? ($message['videoMessage']['caption'] ?? null)
            ?? null;

        if (! is_string($body) || trim($body) === '') {
            return response()->json(['ok' => true, 'skipped' => 'no_text']);
        }

        // Preferir remoteJidAlt / senderPn cuando WhatsApp usa addressingMode=lid
        $lid = CarWashPhoneNormalizer::lidFromEvolutionKey($key, $data);
        $phone = CarWashPhoneNormalizer::fromEvolutionKey($key, $data);

        // Si el webhook solo trae @lid sin remoteJidAlt, resolver PN vía Evolution
        if ($phone === '' && $lid) {
            app(\App\Services\CarWash\CarWashSettingsService::class)->applyRuntime();
            $phone = app(\App\Services\CarWash\WhatsApp\EvolutionApiWhatsAppGateway::class)
                ->resolvePhoneFromLid($lid) ?? '';
        }

        if ($phone === '') {
            Log::warning('CarWash Evolution webhook sin teléfono usable', [
                'remoteJid' => $remoteJid,
                'lid' => $lid,
                'has_alt' => filled($key['remoteJidAlt'] ?? null),
            ]);

            return response()->json(['ok' => true, 'skipped' => 'no_phone']);
        }
        $messageId = $key['id'] ?? null;

        $inbound = [
            'phone' => $phone,
            'body' => trim($body),
            'provider_message_id' => $messageId ? (string) $messageId : null,
            'customer_name' => $data['pushName'] ?? null,
            'payload' => $request->all(),
            'provider' => 'evolution',
            'evolution_lid' => $lid,
            'evolution_remote_jid' => $lid ?: ($remoteJid !== '' ? $remoteJid : null),
        ];

        // Procesar en este request (más fiable que afterResponse en algunos hosts)
        try {
            app(CarWashWhatsAppInboundService::class)->handle($inbound);
        } catch (\Throwable $e) {
            Log::error('CarWash WhatsApp inbound handle failed', [
                'message' => $e->getMessage(),
                'phone' => $phone,
            ]);

            return response()->json(['ok' => false, 'error' => 'handle_failed'], 500);
        }

        return response()->json(['ok' => true]);
    }

    public function twilio(Request $request)
    {
        if (! $this->authorizeTwilio($request)) {
            return response('Unauthorized', 401);
        }

        $from = (string) $request->input('From', '');
        $body = trim((string) $request->input('Body', ''));
        $sid = $request->input('MessageSid') ?: $request->input('SmsMessageSid');

        if ($from === '' || $body === '') {
            return response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', 200)
                ->header('Content-Type', 'text/xml');
        }

        $inbound = [
            'phone' => CarWashPhoneNormalizer::e164($from),
            'body' => $body,
            'provider_message_id' => $sid ? (string) $sid : null,
            'customer_name' => $request->input('ProfileName'),
            'payload' => $request->all(),
            'provider' => 'twilio',
        ];

        dispatch(function () use ($inbound) {
            app(CarWashWhatsAppInboundService::class)->handle($inbound);
        })->afterResponse();

        // Respuesta vacía: el bot responde vía API async
        return response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', 200)
            ->header('Content-Type', 'text/xml');
    }

    /**
     * Envío manual admin (pruebas / handoff).
     */
    public function send(Request $request, WhatsAppGatewayResolver $gateways, CarWashWhatsAppInboundService $inbound)
    {
        try {
            $data = $request->validate([
                'phone' => 'required|string|max:32',
                'body' => 'required|string|max:4000',
            ]);

            $gateway = $gateways->default();
            if (! $gateway->isConfigured()) {
                return ApiResponseHelper::apiError('WhatsApp no configurado', null, 503, 'CARWASH_WA_NOT_CONFIGURED');
            }

            // Reusa persistencia creando/actualizando conversación
            $phone = CarWashPhoneNormalizer::e164($data['phone']);
            $alt = CarWashPhoneNormalizer::mexicoAlternate($phone);
            $phones = array_values(array_filter([$phone, $alt]));
            $conversation = \App\Models\CarWash\CarWashWhatsAppConversation::query()
                ->whereIn('phone', $phones)
                ->orderByRaw('CASE WHEN phone = ? THEN 0 ELSE 1 END', [$phone])
                ->first();

            if (! $conversation) {
                $conversation = \App\Models\CarWash\CarWashWhatsAppConversation::query()->create([
                    'phone' => $phone,
                    'status' => 'open',
                    'needs_human' => false,
                ]);
            } elseif ($conversation->phone !== $phone && str_starts_with($phone, '+521')) {
                $conversation->phone = $phone;
                $conversation->save();
            }

            $inbound->sendAndStore($conversation, $data['body']);

            return ApiResponseHelper::apiSuccess(200, 'Mensaje enviado', [
                'phone' => $phone,
                'provider' => $gateway->provider(),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Throwable $e) {
            Log::error('CarWash WhatsApp admin send failed', ['message' => $e->getMessage()]);

            return ApiResponseHelper::apiError('Error al enviar WhatsApp', $e->getMessage(), 500, 'CARWASH_WA_SEND');
        }
    }

    public function status(WhatsAppGatewayResolver $gateways)
    {
        $gateway = $gateways->default();

        return ApiResponseHelper::apiSuccess(200, 'Estado canal WhatsApp CarWash', [
            'provider' => $gateway->provider(),
            'configured' => $gateway->isConfigured(),
            'agent_enabled' => (bool) config('carwash.agent.enabled', true),
        ]);
    }

    private function authorizeEvolution(Request $request): bool
    {
        app(\App\Services\CarWash\CarWashSettingsService::class)->applyRuntime();
        $secret = (string) config('carwash.evolution.webhook_secret', '');
        if ($secret === '') {
            // Sin secret: acepta (sandbox). Recomendado configurar EVOLUTION_WEBHOOK_SECRET.
            return true;
        }

        $candidates = [
            $request->header('x-webhook-secret'),
            $request->header('x-carwash-webhook-secret'),
            $request->header('apikey'),
            $request->query('secret'),
            $request->input('apikey'),
        ];

        foreach ($candidates as $value) {
            if (is_string($value) && hash_equals($secret, $value)) {
                return true;
            }
        }

        return false;
    }

    private function authorizeTwilio(Request $request): bool
    {
        app(\App\Services\CarWash\CarWashSettingsService::class)->applyRuntime();
        $secret = (string) config('carwash.twilio.webhook_secret', '');
        if ($secret === '') {
            return true;
        }

        $provided = $request->header('x-twilio-webhook-secret')
            ?: $request->query('secret')
            ?: $request->input('secret');

        return is_string($provided) && hash_equals($secret, $provided);
    }
}
