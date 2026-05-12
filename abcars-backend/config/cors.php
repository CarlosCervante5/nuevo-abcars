<?php

use Illuminate\Support\Env;
/*
|--------------------------------------------------------------------------
| CORS Allowed Origins
|--------------------------------------------------------------------------
| Con supports_credentials=true no se puede usar '*'. Debe ser explícito.
| CORS_ALLOWED_ORIGINS: se fusiona con la lista por defecto (no la sustituye), para
| que en Railway el sandbox (honest-art-sandbox) siga permitido aunque en el
| .env del servidor solo figuren URLs de producción.
*/
$corsEnv = Env::get('CORS_ALLOWED_ORIGINS');
$fromEnv = is_string($corsEnv) && $corsEnv !== ''
    ? array_values(array_filter(
        array_map('trim', explode(',', $corsEnv)),
        static fn (string $o): bool => $o !== ''
    ))
    : [];

$defaults = array_values(array_filter([
    Env::get('FRONTEND_URL'),
    'https://honest-art-sandbox.up.railway.app',
    'https://honest-art-production-20e5.up.railway.app',
    'https://vigilant-renewal-production-d135.up.railway.app',
    'https://abcars.mx',
    'https://www.abcars.mx',
    'http://localhost:4200',
    'http://localhost:4201',
    'http://localhost:5173',
    'http://localhost:5176',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:4201',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5176',
], static function ($u) {
    return is_string($u) && $u !== '';
}));

$allowedOrigins = array_values(array_unique([...$fromEnv, ...$defaults]));

if ($allowedOrigins === []) {
    $allowedOrigins = [
        'https://honest-art-sandbox.up.railway.app',
        'https://honest-art-production-20e5.up.railway.app',
        'https://vigilant-renewal-production-d135.up.railway.app',
        'http://localhost:4200',
    ];
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

    // «api-docs» es ruta web (web.php), no bajo /api — sin esto el admin Angular no puede leerla por CORS
    // «api» sin subruta: GET /api (info raíz) no coincide con «api/*»
    'paths' => ['api', 'api/*', 'api-docs', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
