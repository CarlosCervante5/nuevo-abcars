<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Proveedor WhatsApp CarWash
    |--------------------------------------------------------------------------
    | evolution = Evolution API / Evolution API Cloud (recomendado)
    | twilio    = Twilio WhatsApp
    */
    'whatsapp_provider' => env('CARWASH_WHATSAPP_PROVIDER', 'evolution'),

    'evolution' => [
        'base_url' => rtrim((string) env('EVOLUTION_API_URL', ''), '/'),
        'api_key' => env('EVOLUTION_API_KEY', ''),
        'instance' => env('EVOLUTION_INSTANCE', ''),
        /** Header o query opcional para validar webhooks entrantes */
        'webhook_secret' => env('EVOLUTION_WEBHOOK_SECRET', ''),
        'timeout' => (int) env('EVOLUTION_API_TIMEOUT', 30),
    ],

    'twilio' => [
        'account_sid' => env('TWILIO_ACCOUNT_SID', ''),
        'auth_token' => env('TWILIO_AUTH_TOKEN', ''),
        'from' => env('TWILIO_WHATSAPP_FROM', ''),
        'webhook_secret' => env('TWILIO_WEBHOOK_SECRET', ''),
        'timeout' => (int) env('TWILIO_API_TIMEOUT', 30),
    ],

    'agent' => [
        'enabled' => filter_var(env('CARWASH_WHATSAPP_AGENT_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
        'history_limit' => (int) env('CARWASH_WHATSAPP_HISTORY_LIMIT', 6),
        'model' => env('CARWASH_WHATSAPP_OPENAI_MODEL', 'gpt-4o-mini'),
        'max_tool_rounds' => (int) env('CARWASH_WHATSAPP_MAX_TOOL_ROUNDS', 3),
        'openai_timeout' => (int) env('CARWASH_WHATSAPP_OPENAI_TIMEOUT', 25),
        // Opcional: override de OPENAI_API_KEY vía settings (si vacío, se usa services.openai.key / env).
        'openai_api_key' => env('OPENAI_API_KEY', ''),
    ],

];
