<?php

namespace App\Helpers;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class ValuationAccessHelper
{
    /** Admin global: ve todas las valuaciones, sin mutaciones en flujo de valuador/técnico. */
    public static function isGlobalReadOnlyViewer(?User $user): bool
    {
        return $user !== null && $user->hasRole(['administrator', 'super_admin']);
    }

    public static function mutationDeniedResponse(): JsonResponse
    {
        return ApiResponseHelper::apiError(
            'Acceso de solo lectura',
            'Los administradores pueden consultar valuaciones pero no modificarlas.',
            403,
            'VALUATION_READ_ONLY'
        );
    }
}
