<?php

namespace App\Support;

/**
 * Misma intención que abcars-valuation-ionic `buildRecortePrompt()` (ciclorama ABCars + Gemini).
 */
final class VehicleGeminiRecortePrompt
{
    private const STUDIO_CATALOG_BACKDROP_TOP_HEX = '#fafbfc';

    private const STUDIO_CATALOG_BACKDROP_HORIZON_HEX = '#e4e8ec';

    private const STUDIO_CATALOG_FLOOR_UNDER_VEHICLE_HEX = '#e8ebef';

    private const STUDIO_CATALOG_FLOOR_FOREGROUND_HEX = '#f2f4f7';

    private const STUDIO_CATALOG_COLOR_HINT =
        'Ciclorama continuo en todo el encuadre con paleta FIJA ABCars: detrás del vehículo (pared del estudio) '
        . self::STUDIO_CATALOG_BACKDROP_TOP_HEX
        . ' arriba degradando suavemente a '
        . self::STUDIO_CATALOG_BACKDROP_HORIZON_HEX
        . ' en el horizonte del curvado; '
        . 'piso mate '
        . self::STUDIO_CATALOG_FLOOR_UNDER_VEHICLE_HEX
        . ' bajo el auto hasta '
        . self::STUDIO_CATALOG_FLOOR_FOREGROUND_HEX
        . ' en primer plano. '
        . 'Usar exactamente estos hex (no sustituir por otros grises). Sin texturas, rejillas ni objetos. '
        . 'Prohibido conservar techo, luces, columnas, cielo o cualquier resto del local original, aunque esté difuminado.';

    private const PROMPT_RECORTE_ES = 'Recorte y fondo: detecta el vehículo principal, recorta y aísla el auto. Elimina por completo el entorno original (techo, paredes, columnas, suelo viejo, cielo, árboles, carteles): no lo dejes difuminado ni en una franja superior. Sustituye el 100% del fondo por el estudio de catálogo ABCars, un solo ciclorama continuo (' . self::STUDIO_CATALOG_COLOR_HINT . '). Embellece: suciedad leve, reflejos equilibrados, acabado premium. Mantén la identidad exacta del coche (modelo, proporciones, llantas, emblemas).';

    private const STUDIO_CATALOG_HEX_SPEC_EN =
        'Mandatory fixed studio palette (match these hex values everywhere outside the vehicle): '
        . 'backdrop/wall upper region ' . self::STUDIO_CATALOG_BACKDROP_TOP_HEX . ', blending to '
        . self::STUDIO_CATALOG_BACKDROP_HORIZON_HEX . ' at the cyclorama horizon/curve; '
        . 'floor matte ' . self::STUDIO_CATALOG_FLOOR_UNDER_VEHICLE_HEX . ' under the tires, blending to '
        . self::STUDIO_CATALOG_FLOOR_FOREGROUND_HEX . ' toward the foreground. '
        . 'No medium-gray or dark-gray studio; no glossy showroom mirror floor.';

    private const STUDIO_RECORTE_SUFFIX_EN =
        '[Technical output requirement] ' . self::STUDIO_CATALOG_HEX_SPEC_EN . ' '
        . 'Full-frame cyclorama only: every pixel outside the vehicle silhouette must use only this fixed palette—no visible original environment '
        . '(no blurred ceiling, lights, pillars, showroom, sky, or horizon from the source photo). '
        . 'No horizontal “blend band” between old scene and studio. Seamless wall-to-floor curve only. '
        . 'Tight framing around the vehicle with consistent margins. Subtle beautify: dirt reduction, balanced reflections, catalog finish. '
        . 'Do NOT change vehicle identity, geometry, badges, wheels, or proportions. Photorealistic edges and a soft natural contact shadow on the new floor.';

    public static function build(): string
    {
        return trim(self::PROMPT_RECORTE_ES) . "\n\n" . self::STUDIO_RECORTE_SUFFIX_EN;
    }
}
