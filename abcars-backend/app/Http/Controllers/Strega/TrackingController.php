<?php

namespace App\Http\Controllers\Strega;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Strega\Opportunities\StoreOpportunityRequest;


class TrackingController extends Controller
{
    // protected $opportunityService;

    // public function __construct(OpportunityService $opportunityService, UserService $userService)
    // {
    //     $this->opportunityService = $opportunityService;
    // }

    
    /**
     * Crear oportunidad
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function create( StoreOpportunityRequest $request )
    {
        try {

            $user = auth()->user();

            $data = $request->validated();

            $this->opportunityService->createOpportunity($data, $user);

            return ApiResponseHelper::apiSuccess(200, 'Oportunidades creada exitosamente');

        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear la oportunidad', $e->getMessage(), 500, 'CREATE_OPPORTUNITY_ERROR');
        }
    }

}
