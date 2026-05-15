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

    /*
    | Hex RGB sin #: usado al subir fotos de vehículos para aplanar transparencia sobre
    | fondo antes de guardar en Cloudinary (misma idea que b_rgb en URLs de entrega).
    | Por defecto alinea con INTELIMOTOR_PICTURE_BG_RGB si está definido.
    */
    'vehicle_upload_flatten_bg_rgb' => Env::get(
        'CLOUDINARY_VEHICLE_UPLOAD_BG_RGB',
        Env::get('INTELIMOTOR_PICTURE_BG_RGB', 'fafbfc')
    ),
];