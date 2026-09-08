<?php

namespace App\Services\CarWash\WhatsApp;

use InvalidArgumentException;

class WhatsAppGatewayResolver
{
    public function __construct(
        private EvolutionApiWhatsAppGateway $evolution,
        private TwilioWhatsAppGateway $twilio,
    ) {}

    public function resolve(?string $provider = null): WhatsAppGatewayInterface
    {
        $provider = strtolower($provider ?: (string) config('carwash.whatsapp_provider', 'evolution'));

        return match ($provider) {
            'evolution', 'evolution_api', 'evo', 'evolutionapi' => $this->evolution,
            'twilio' => $this->twilio,
            default => throw new InvalidArgumentException("Proveedor WhatsApp desconocido: {$provider}"),
        };
    }

    public function default(): WhatsAppGatewayInterface
    {
        return $this->resolve();
    }
}
