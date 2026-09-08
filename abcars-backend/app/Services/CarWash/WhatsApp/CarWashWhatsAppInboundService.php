<?php

namespace App\Services\CarWash\WhatsApp;

use App\Models\CarWash\CarWashWhatsAppConversation;
use App\Models\CarWash\CarWashWhatsAppMessage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CarWashWhatsAppInboundService
{
    public function __construct(
        private WhatsAppGatewayResolver $gateways,
        private CarWashWhatsAppAgentService $agent,
    ) {}

    /**
     * Procesa un mensaje entrante normalizado.
     *
     * @param  array{phone: string, body: string, provider_message_id?: string|null, customer_name?: string|null, payload?: array|null, provider?: string|null}  $inbound
     */
    public function handle(array $inbound): void
    {
        $phone = CarWashPhoneNormalizer::e164((string) ($inbound['phone'] ?? ''));
        $body = trim((string) ($inbound['body'] ?? ''));
        $providerMessageId = $inbound['provider_message_id'] ?? null;

        if ($phone === '' || $body === '') {
            return;
        }

        if ($providerMessageId) {
            $exists = CarWashWhatsAppMessage::query()->where('twilio_sid', $providerMessageId)->exists();
            if ($exists) {
                return;
            }
        }

        $conversation = CarWashWhatsAppConversation::query()->firstOrCreate(
            ['phone' => $phone],
            [
                'customer_name' => $inbound['customer_name'] ?? null,
                'status' => 'open',
                'needs_human' => false,
                'meta' => ['provider' => $inbound['provider'] ?? config('carwash.whatsapp_provider')],
            ]
        );

        if (! empty($inbound['customer_name']) && empty($conversation->customer_name)) {
            $conversation->customer_name = $inbound['customer_name'];
        }

        DB::transaction(function () use ($conversation, $body, $providerMessageId, $inbound) {
            CarWashWhatsAppMessage::create([
                'conversation_id' => $conversation->id,
                'direction' => 'inbound',
                'twilio_sid' => $providerMessageId,
                'body' => $body,
                'status' => 'received',
                'payload' => $inbound['payload'] ?? null,
            ]);

            $conversation->last_message_at = now();
            $conversation->status = 'open';
            $conversation->save();
        });

        if ($conversation->needs_human) {
            $this->sendAndStore(
                $conversation,
                'Tu mensaje quedó con un asesor. Te contactaremos pronto. Si es urgente, indícalo aquí.'
            );

            return;
        }

        $history = $this->agent->historyFromConversation($conversation->fresh());
        // Quitar el último inbound recién guardado del history que el agent también recibe como userMessage
        if (! empty($history) && end($history)['role'] === 'user') {
            array_pop($history);
        }

        $reply = $this->agent->reply($body, $history, $phone);
        $this->sendAndStore($conversation, $reply);
    }

    public function sendAndStore(CarWashWhatsAppConversation $conversation, string $body): void
    {
        $body = trim($body);
        if ($body === '') {
            return;
        }

        $gateway = $this->gateways->default();
        $result = $gateway->sendText($conversation->phone, $body);

        CarWashWhatsAppMessage::create([
            'conversation_id' => $conversation->id,
            'direction' => 'outbound',
            'twilio_sid' => $result['provider_message_id'] ?? null,
            'body' => $body,
            'status' => ($result['ok'] ?? false) ? 'sent' : 'failed',
            'payload' => [
                'provider' => $gateway->provider(),
                'result' => $result,
            ],
        ]);

        $conversation->last_message_at = now();
        $conversation->save();

        if (! ($result['ok'] ?? false)) {
            Log::warning('CarWash WhatsApp outbound failed', [
                'phone' => $conversation->phone,
                'error' => $result['error'] ?? null,
            ]);
        }
    }
}
