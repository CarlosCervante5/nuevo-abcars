<?php

namespace App\Services\CarWash\WhatsApp;

class CarWashPhoneNormalizer
{
    /**
     * Normaliza a dígitos (sin +). Útil para Evolution API.
     */
    public static function digits(string $raw): string
    {
        $raw = trim($raw);
        $raw = preg_replace('/^whatsapp:/i', '', $raw) ?? $raw;
        $raw = preg_replace('/@.*$/', '', $raw) ?? $raw;
        $digits = preg_replace('/\D+/', '', $raw) ?? '';

        // MX común: 10 dígitos locales → 52 + número
        if (strlen($digits) === 10) {
            return '52'.$digits;
        }

        return $digits;
    }

    /**
     * Formato de almacenamiento (+E.164 aproximado).
     */
    public static function e164(string $raw): string
    {
        $digits = self::digits($raw);
        if ($digits === '') {
            return '';
        }

        return '+'.$digits;
    }

    public static function forTwilio(string $raw): string
    {
        $e164 = self::e164($raw);

        return $e164 === '' ? '' : 'whatsapp:'.$e164;
    }
}
