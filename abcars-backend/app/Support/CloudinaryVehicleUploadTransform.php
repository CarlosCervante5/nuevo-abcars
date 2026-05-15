<?php

namespace App\Support;

use Illuminate\Support\Facades\Config;

/**
 * Transformación de ingreso para fotos de vehículos en Cloudinary:
 * convierte PNG con alpha (recorte IA, etc.) en JPEG opaco con fondo tipo estudio.
 *
 * Sin esto, solo `fetch_format => jpg` puede seguir almacenando/transmitiendo transparencia.
 */
final class CloudinaryVehicleUploadTransform
{
    public static function incomingFlattenRgbHex(): string
    {
        $raw = (string) Config::get('cloudinary.vehicle_upload_flatten_bg_rgb', 'fafbfc');
        $hex = strtolower(preg_replace('/[^a-f0-9]/', '', $raw));

        return strlen($hex) === 6 ? $hex : 'fafbfc';
    }

    /**
     * Hash reconocido por cloudinary-php / Upload API (incoming transformation).
     *
     * @return array<string, string>
     */
    public static function incomingFlattenTransformation(): array
    {
        $hex = self::incomingFlattenRgbHex();

        return [
            'fetch_format' => 'jpg',
            'quality' => 'auto',
            'background' => 'rgb:'.$hex,
        ];
    }
}
