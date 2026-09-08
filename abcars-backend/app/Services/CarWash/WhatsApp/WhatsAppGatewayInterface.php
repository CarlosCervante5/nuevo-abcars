<?php

namespace App\Services\CarWash\WhatsApp;

interface WhatsAppGatewayInterface
{
    public function provider(): string;

    /**
     * @return array{ok: bool, provider_message_id?: string|null, raw?: mixed, error?: string|null}
     */
    public function sendText(string $toPhone, string $body): array;

    public function isConfigured(): bool;
}
