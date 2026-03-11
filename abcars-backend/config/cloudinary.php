<?php

$url = env('CLOUDINARY_URL');
if ($url !== null && $url !== '') {
    $url = trim($url);
}
// Si no hay URL pero sí credenciales por separado (útil si el API Secret tiene caracteres especiales)
if (empty($url) && env('CLOUDINARY_CLOUD_NAME') && env('CLOUDINARY_API_KEY') && env('CLOUDINARY_API_SECRET')) {
    $secret = env('CLOUDINARY_API_SECRET');
    $url = sprintf(
        'cloudinary://%s:%s@%s',
        env('CLOUDINARY_API_KEY'),
        rawurlencode($secret),
        env('CLOUDINARY_CLOUD_NAME')
    );
}

return [
    'url' => $url ?: null,
];