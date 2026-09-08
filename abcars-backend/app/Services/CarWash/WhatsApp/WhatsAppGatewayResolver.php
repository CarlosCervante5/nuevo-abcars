<?php

namespace App\Services\CarWash\WhatsApp;

use App\Services\CarWash\CarWashSettingsService;
use InvalidArgumentException;

class WhatsAppGatewayResolver
{
    public function __construct(
        private EvolutionApiWhatsAppGateway $evolution,
        private TwilioWhatsAppGateway $twilio,
        private CarWashSettingsService $settings,
    ) {}

    public function resolve(?string $provider = null): WhatsAppGatewayInterface
    {
        $this->settings->applyRuntime();
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
