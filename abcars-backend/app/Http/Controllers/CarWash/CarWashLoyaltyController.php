<?php

namespace App\Http\Controllers\CarWash;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Services\CarWash\CarWashLoyaltyService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CarWashLoyaltyController extends Controller
{
    public function __construct(private CarWashLoyaltyService $loyalty) {}

    public function settings()
    {
        try {
            return ApiResponseHelper::apiSuccess(200, 'Loyalty CarWash', [
                'settings' => $this->loyalty->getSettings(),
                'tables_ready' => $this->loyalty->tablesReady(),
            ]);
        } catch (\Throwable $e) {
            return ApiResponseHelper::apiError('Error loyalty settings', $e->getMessage(), 500, 'CARWASH_LOYALTY_SETTINGS');
        }
    }

    public function updateSettings(Request $request)
    {
        try {
            $data = $request->validate([
                'enabled' => 'sometimes|boolean',
                'slots' => 'sometimes|integer|min:1|max:20',
                'reward_text' => 'sometimes|string|max:500',
                'stamp_emoji' => 'sometimes|string|max:16',
                'empty_emoji' => 'sometimes|string|max:16',
            ]);

            $settings = $this->loyalty->updateSettings($data);

            return ApiResponseHelper::apiSuccess(200, 'Loyalty actualizado', [
                'settings' => $settings,
                'tables_ready' => $this->loyalty->tablesReady(),
            ]);
        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Throwable $e) {
            return ApiResponseHelper::apiError('Error al guardar loyalty', $e->getMessage(), 500, 'CARWASH_LOYALTY_UPDATE');
        }
    }

    public function cards()
    {
        try {
            return ApiResponseHelper::apiSuccess(200, 'Cuponeras CarWash', [
                'settings' => $this->loyalty->getSettings(),
                'cards' => $this->loyalty->listCards(150),
            ]);
        } catch (\Throwable $e) {
            return ApiResponseHelper::apiError('Error al listar cuponeras', $e->getMessage(), 500, 'CARWASH_LOYALTY_CARDS');
        }
    }
}
