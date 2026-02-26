<?php

/*
|--------------------------------------------------------------------------
| CORS Allowed Origins
|--------------------------------------------------------------------------
| Con supports_credentials=true no se puede usar '*'. Debe ser explícito.
| CORS_ALLOWED_ORIGINS: lista separada por comas (ej: https://app.com,https://app2.com)
*/
$corsEnv = env('CORS_ALLOWED_ORIGINS');
$allowedOrigins = $corsEnv
    ? array_map('trim', explode(',', $corsEnv))
    : array_values(array_filter([
        env('FRONTEND_URL'),
        'https://vigilant-renewal-production-d135.up.railway.app',
        'https://abcars.mx',
        'http://localhost:4200',
        'http://localhost:4201',
        'http://127.0.0.1:4200',
    ]));
if (empty($allowedOrigins)) {
    $allowedOrigins = ['https://vigilant-renewal-production-d135.up.railway.app', 'http://localhost:4200'];
}

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
