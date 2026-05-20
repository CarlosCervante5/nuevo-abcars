<?php

namespace App\Support;

/** Nombres de campaña marketing para el hero del inicio (desktop / móvil). */
final class MainBannerNames
{
    public const DESKTOP = 'Imagen banner principal';

    public const MOBILE = 'Imagen banner principal móvil';

    /** Búsqueda pública legacy (POST /api/banner/search). */
    public const SEARCH_LEGACY = self::DESKTOP;

    public static function forVariant(?string $variant): string
    {
        return $variant === 'mobile' ? self::MOBILE : self::DESKTOP;
    }

    public static function isValidVariant(?string $variant): bool
    {
        return $variant === null || in_array($variant, ['desktop', 'mobile'], true);
    }
}
