<?php

use Illuminate\Support\Env;
$url = Env::get('CLOUDINARY_URL');
if ($url !== null && $url !== '') {
    $url = trim($url);
}
// Si no hay URL pero sí credenciales por separado (útil si el API Secret tiene caracteres especiales)
if (empty($url) && Env::get('CLOUDINARY_CLOUD_NAME') && Env::get('CLOUDINARY_API_KEY') && Env::get('CLOUDINARY_API_SECRET')) {
    // Railway variables sometimes include accidental whitespace/newlines.
    // Trim to avoid invalid signature errors caused by a slightly different secret.
    $secret = trim((string) Env::get('CLOUDINARY_API_SECRET'));
    $apiKey = trim((string) Env::get('CLOUDINARY_API_KEY'));
    $cloudName = trim((string) Env::get('CLOUDINARY_CLOUD_NAME'));
    $url = sprintf(
        'cloudinary://%s:%s@%s',
        $apiKey,
        rawurlencode($secret),
        $cloudName
    );
}

return [
    'url' => $url ?: null,
];