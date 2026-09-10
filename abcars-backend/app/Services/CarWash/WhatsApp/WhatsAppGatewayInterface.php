<?php

namespace App\Services\CarWash\WhatsApp;

interface WhatsAppGatewayInterface
{
    public function provider(): string;

    /**
     * @param  array{preferred_jid?: string|null}  $options
     * @return array{ok: bool, provider_message_id?: string|null, raw?: mixed, error?: string|null}
     */
    public function sendText(string $toPhone, string $body, array $options = []): array;

    public function isConfigured(): bool;
}
