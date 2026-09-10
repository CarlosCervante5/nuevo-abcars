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

        $conversation = $this->findOrCreateConversation(
            $phone,
            $inbound['customer_name'] ?? null,
            $inbound['provider'] ?? null
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

        $conversation = $conversation->fresh();

        // Reinicio de flujo: "0" / iniciar / reiniciar (si el usuario se trabó)
        if ($this->isResetCommand($body)) {
            $this->resetConversationContext($conversation);
            $this->sendAndStore($conversation->fresh(), $this->welcomeAfterResetMessage());

            return;
        }

        if ($conversation->needs_human) {
            $this->sendAndStore(
                $conversation,
                'Tu mensaje quedó con un asesor. Te contactaremos pronto. Si es urgente, indícalo aquí.'."\n\n".
                'Si quieres empezar de nuevo escribe *0* o *iniciar*.'
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

    private function isResetCommand(string $body): bool
    {
        $normalized = mb_strtolower(trim($body));
        $normalized = preg_replace('/\s+/u', ' ', $normalized) ?? $normalized;
        // Quitar signos comunes de WhatsApp
        $normalized = trim($normalized, " \t\n\r\0\x0B.!¡?¿*\"'");

        if ($normalized === '0') {
            return true;
        }

        return (bool) preg_match(
            '/^(iniciar|inciar|reiniciar|reset|menu|menú|inicio|empezar|comenzar|hola\s*bot)$/u',
            $normalized
        );
    }

    private function resetConversationContext(CarWashWhatsAppConversation $conversation): void
    {
        $meta = is_array($conversation->meta) ? $conversation->meta : [];
        $meta['context_reset_at'] = now()->toIso8601String();
        $meta['context_reset_reason'] = 'user_command';
        unset($meta['handoff_reason'], $meta['handoff_at']);

        $conversation->needs_human = false;
        $conversation->status = 'open';
        $conversation->meta = $meta;
        $conversation->last_message_at = now();
        $conversation->save();

        Log::info('CarWash WhatsApp conversation reset', [
            'conversation_uuid' => $conversation->uuid,
            'phone' => $conversation->phone,
        ]);
    }

    private function welcomeAfterResetMessage(): string
    {
        return implode("\n", [
            '¡Listo! Reiniciamos la conversación 👋',
            '',
            'Soy el asistente de *ABCars CarWash*.',
            '¿Quieres *agendar un lavado* o consultar tus *sellos*?',
            '',
            'Si en cualquier momento te trabas, escribe *0* o *iniciar* para volver al inicio.',
        ]);
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

        $conversation = $this->findOrCreateConversation(
            $phone,
            $customerName,
            $payload['provider'] ?? null
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

    /**
     * Busca conversación por +521… o variante +52… (evita duplicados MX).
     */
    private function findOrCreateConversation(
        string $phone,
        ?string $customerName = null,
        ?string $provider = null,
    ): CarWashWhatsAppConversation {
        $alt = CarWashPhoneNormalizer::mexicoAlternate($phone);
        $phones = array_values(array_filter([$phone, $alt]));

        $conversation = CarWashWhatsAppConversation::query()
            ->whereIn('phone', $phones)
            ->orderByRaw('CASE WHEN phone = ? THEN 0 ELSE 1 END', [$phone])
            ->first();

        if ($conversation) {
            // Preferir formato WhatsApp MX (+521…) al reenviar
            if ($conversation->phone !== $phone && str_starts_with($phone, '+521')) {
                $conversation->phone = $phone;
                $conversation->save();
            }

            return $conversation;
        }

        return CarWashWhatsAppConversation::query()->create([
            'phone' => $phone,
            'customer_name' => $customerName,
            'status' => 'open',
            'needs_human' => false,
            'meta' => ['provider' => $provider ?? config('carwash.whatsapp_provider')],
        ]);
    }
}
