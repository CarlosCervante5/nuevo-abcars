<?php

use Illuminate\Support\Env;

/**
 * Optimización local de fotos de vehículos (sin Cloudinary).
 * Flujo: archivo local → JPEG aplanado → S3 → CloudFront.
 */
return [
    /*
    | local = Imagick/GD en el servidor (recomendado).
    | cloudinary = flujo legacy (solo si el cloud está activo).
    */
    'optimizer' => Env::get('VEHICLE_IMAGE_OPTIMIZER', 'local'),

    'max_width' => (int) Env::get('VEHICLE_IMAGE_MAX_WIDTH', 2400),

    'jpeg_quality' => (int) Env::get('VEHICLE_IMAGE_JPEG_QUALITY', 85),

    /*
    | Fondo al aplanar PNG con alpha (recorte IA, etc.). Hex sin #.
    | Alineado con el flatten que usaba Cloudinary (#fafbfc).
    */
    'flatten_bg_rgb' => Env::get(
        'VEHICLE_IMAGE_FLATTEN_BG_RGB',
        Env::get(
            'CLOUDINARY_VEHICLE_UPLOAD_BG_RGB',
            Env::get('INTELIMOTOR_PICTURE_BG_RGB', 'fafbfc')
        )
    ),

    /*
    | Preferir imagick si está cargado; si no, gd.
    | Valores: auto | imagick | gd
    */
    'driver' => Env::get('VEHICLE_IMAGE_DRIVER', 'auto'),
];
