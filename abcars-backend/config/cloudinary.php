<?php

$url = env('CLOUDINARY_URL');
if ($url !== null && $url !== '') {
    $url = trim($url);
}
// Si no hay URL pero sí credenciales por separado (útil si el API Secret tiene caracteres especiales)
if (empty($url) && env('CLOUDINARY_CLOUD_NAME') && env('CLOUDINARY_API_KEY') && env('CLOUDINARY_API_SECRET')) {
    // Railway variables sometimes include accidental whitespace/newlines.
    // Trim to avoid invalid signature errors caused by a slightly different secret.
    $secret = trim((string) env('CLOUDINARY_API_SECRET'));
    $apiKey = trim((string) env('CLOUDINARY_API_KEY'));
    $cloudName = trim((string) env('CLOUDINARY_CLOUD_NAME'));
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