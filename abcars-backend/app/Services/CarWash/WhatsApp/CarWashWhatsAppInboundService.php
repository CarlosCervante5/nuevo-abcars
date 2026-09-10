<?php

namespace App\Services\CarWash\WhatsApp;

use App\Models\CarWash\CarWashWhatsAppConversation;
use App\Models\CarWash\CarWashWhatsAppMessage;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Cache;
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

        // Serializa por conversación: evita loops por webhooks/reintentos en paralelo
        $lockKey = 'carwash-wa:conv:'.sha1($phone);
        // Cache::add es portable (file/redis); lock atómico no siempre está disponible
        if (! Cache::add($lockKey, 1, 90)) {
            Log::info('CarWash WhatsApp inbound skipped (lock busy)', [
                'phone' => $phone,
                'provider_message_id' => $providerMessageId,
            ]);

            return;
        }

        try {
            $this->handleLocked($inbound, $phone, $body, $providerMessageId);
        } finally {
            Cache::forget($lockKey);
        }
    }

    /**
     * @param  array<string, mixed>  $inbound
     */
    private function handleLocked(array $inbound, string $phone, string $body, ?string $providerMessageId): void
    {
        // Re-check dentro del lock
        if ($providerMessageId) {
            $exists = CarWashWhatsAppMessage::query()->where('twilio_sid', $providerMessageId)->exists();
            if ($exists) {
                return;
            }
        }

        // Mismo texto entrante reciente → no volver a responder (reintentos Evolution)
        $recentDuplicate = CarWashWhatsAppMessage::query()
            ->where('direction', 'inbound')
            ->where('body', $body)
            ->where('created_at', '>=', now()->subMinutes(2))
            ->whereHas('conversation', function ($q) use ($phone) {
                $alt = CarWashPhoneNormalizer::mexicoAlternate($phone);
                $phones = array_values(array_filter([$phone, $alt]));
                $q->whereIn('phone', $phones);
            })
            ->exists();

        if ($recentDuplicate && ! $providerMessageId) {
            return;
        }

        if ($recentDuplicate && $providerMessageId) {
            // Ya respondimos a este mismo texto hace poco: solo registrar id si es nuevo
            try {
                $conversation = $this->findOrCreateConversation(
                    $phone,
                    $inbound['customer_name'] ?? null,
                    $inbound['provider'] ?? null
                );
                CarWashWhatsAppMessage::create([
                    'conversation_id' => $conversation->id,
                    'direction' => 'inbound',
                    'twilio_sid' => $providerMessageId,
                    'body' => $body,
                    'status' => 'received_duplicate',
                    'payload' => $inbound['payload'] ?? null,
                ]);
            } catch (QueryException $e) {
                // unique twilio_sid
            }

            Log::info('CarWash WhatsApp inbound duplicate body skipped', [
                'phone' => $phone,
                'provider_message_id' => $providerMessageId,
            ]);

            return;
        }

        $conversation = $this->findOrCreateConversation(
            $phone,
            $inbound['customer_name'] ?? null,
            $inbound['provider'] ?? null
        );

        $meta = is_array($conversation->meta) ? $conversation->meta : [];
        $changedMeta = false;
        if (! empty($inbound['evolution_lid'])) {
            $meta['evolution_lid'] = $inbound['evolution_lid'];
            $changedMeta = true;
        }
        if (! empty($inbound['evolution_remote_jid'])) {
            $meta['evolution_remote_jid'] = $inbound['evolution_remote_jid'];
            $changedMeta = true;
        }
        if ($changedMeta) {
            $conversation->meta = $meta;
            $conversation->save();
        }

        if (! empty($inbound['customer_name']) && empty($conversation->customer_name)) {
            $conversation->customer_name = $inbound['customer_name'];
        }

        try {
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
        } catch (QueryException $e) {
            // Carrera: otro worker ya insertó el mismo twilio_sid
            Log::info('CarWash WhatsApp inbound race ignored', [
                'provider_message_id' => $providerMessageId,
                'error' => $e->getMessage(),
            ]);

            return;
        }

        $conversation = $conversation->fresh();

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

        // No reenviar el mismo texto outbound en ventana corta (anti-loop)
        $dupOut = CarWashWhatsAppMessage::query()
            ->where('conversation_id', $conversation->id)
            ->where('direction', 'outbound')
            ->where('body', $body)
            ->where('created_at', '>=', now()->subMinutes(3))
            ->exists();

        if ($dupOut) {
            Log::info('CarWash WhatsApp outbound duplicate suppressed', [
                'conversation_uuid' => $conversation->uuid,
            ]);

            return;
        }

        $gateway = $this->gateways->default();
        $meta = is_array($conversation->meta) ? $conversation->meta : [];
        $preferredJid = $meta['evolution_lid']
            ?? $meta['evolution_remote_jid']
            ?? null;

        $result = $gateway->sendText($conversation->phone, $body, [
            'preferred_jid' => is_string($preferredJid) ? $preferredJid : null,
        ]);

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
                'connection_state' => $result['connection_state'] ?? null,
            ]);
        }
    }

    /**
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
