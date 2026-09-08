<?php

namespace App\Http\Controllers\CarWash;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Jobs\ProcessCarWashWhatsAppInbound;
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

        $key = $data['key'] ?? [];
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

        $phone = CarWashPhoneNormalizer::e164($remoteJid);
        $messageId = $key['id'] ?? null;

        ProcessCarWashWhatsAppInbound::dispatch([
            'phone' => $phone,
            'body' => trim($body),
            'provider_message_id' => $messageId ? (string) $messageId : null,
            'customer_name' => $data['pushName'] ?? null,
            'payload' => $request->all(),
            'provider' => 'evolution',
        ]);

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

        ProcessCarWashWhatsAppInbound::dispatch([
            'phone' => CarWashPhoneNormalizer::e164($from),
            'body' => $body,
            'provider_message_id' => $sid ? (string) $sid : null,
            'customer_name' => $request->input('ProfileName'),
            'payload' => $request->all(),
            'provider' => 'twilio',
        ]);

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
            $conversation = \App\Models\CarWash\CarWashWhatsAppConversation::query()->firstOrCreate(
                ['phone' => $phone],
                ['status' => 'open', 'needs_human' => false]
            );
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
