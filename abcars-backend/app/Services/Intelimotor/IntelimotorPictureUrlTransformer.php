<?php

namespace App\Services\Intelimotor;

/**
 * Convierte entregas de Cloudinary a JPG con fondo sólido para envío a Intelimotor.
 * Las fotos con canal alpha (PNG) en la URL original quedan como JPEG con fondo (#fafbfc
 * por defecto, alineado al ciclorama del catálogo).
 */
class IntelimotorPictureUrlTransformer
{
    /**
     * Ajusta la URL de entrega para que Intelimotor reciba siempre un JPEG opaco
     * cuando el recurso está en Cloudinary.
     *
     * No modifica URL firmadas (firma rota). Otras URL (S3, Intelimotor, etc.) se dejan igual.
     */
    public static function forPush(string $url, string $backgroundRgbHex = 'fafbfc'): string
    {
        if ($url === '' || ! str_starts_with($url, 'http')) {
            return $url;
        }

        $bg = strtolower(preg_replace('/[^a-f0-9]/', '', $backgroundRgbHex));
        if (strlen($bg) !== 6) {
            $bg = 'fafbfc';
        }

        $flatten = 'f_jpg,q_auto,b_rgb:'.$bg;

        // URLs firmadas: no insertar transformaciones (invalidarían la firma).
        if (preg_match('#/image/upload/s--#', $url)) {
            return $url;
        }

        if (! preg_match('#^https?://res\.cloudinary\.com/[^/]+/image/upload/#i', $url)) {
            return $url;
        }

        if (str_contains($url, '/image/upload/'.$flatten.'/')) {
            return $url;
        }

        $replaced = preg_replace(
            '#(https?://res\.cloudinary\.com/[^/]+/image/upload/)#i',
            '${1}'.$flatten.'/',
            $url,
            1
        );

        return is_string($replaced) ? $replaced : $url;
    }
}
