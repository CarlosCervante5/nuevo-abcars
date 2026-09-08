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

        $this->storeOutboundMessage(
            $conversation,
            $body,
            ($result['ok'] ?? false) ? 'sent' : 'failed',
            $result['provider_message_id'] ?? null,
            [
                'provider' => $gateway->provider(),
                'result' => $result,
            ]
        );

        if (! ($result['ok'] ?? false)) {
            Log::warning('CarWash WhatsApp outbound failed', [
                'phone' => $conversation->phone,
                'error' => $result['error'] ?? null,
            ]);
        }
    }

    /**
     * Persiste un outbound ya enviado (p. ej. notificación de estatus) sin reenviar.
     * Busca/crea la conversación por teléfono normalizado para que aparezca en el inbox admin.
     *
     * @param  array<string, mixed>|null  $payload
     */
    public function storeOutboundAlreadySent(
        string $phone,
        string $body,
        ?string $providerMessageId = null,
        ?array $payload = null,
        ?string $customerName = null,
    ): ?CarWashWhatsAppMessage {
        $phone = CarWashPhoneNormalizer::e164($phone);
        $body = trim($body);
        if ($phone === '' || $body === '') {
            return null;
        }

        if ($providerMessageId) {
            $exists = CarWashWhatsAppMessage::query()->where('twilio_sid', $providerMessageId)->exists();
            if ($exists) {
                return null;
            }
        }

        $conversation = CarWashWhatsAppConversation::query()->firstOrCreate(
            ['phone' => $phone],
            [
                'customer_name' => $customerName,
                'status' => 'open',
                'needs_human' => false,
                'meta' => ['provider' => $payload['provider'] ?? config('carwash.whatsapp_provider')],
            ]
        );

        if ($customerName && empty($conversation->customer_name)) {
            $conversation->customer_name = $customerName;
            $conversation->save();
        }

        return $this->storeOutboundMessage(
            $conversation,
            $body,
            'sent',
            $providerMessageId,
            $payload
        );
    }

    /**
     * @param  array<string, mixed>|null  $payload
     */
    private function storeOutboundMessage(
        CarWashWhatsAppConversation $conversation,
        string $body,
        string $status,
        ?string $providerMessageId = null,
        ?array $payload = null,
    ): CarWashWhatsAppMessage {
        $message = CarWashWhatsAppMessage::create([
            'conversation_id' => $conversation->id,
            'direction' => 'outbound',
            'twilio_sid' => $providerMessageId,
            'body' => $body,
            'status' => $status,
            'payload' => $payload,
        ]);

        $conversation->last_message_at = now();
        $conversation->save();

        return $message;
    }
}
