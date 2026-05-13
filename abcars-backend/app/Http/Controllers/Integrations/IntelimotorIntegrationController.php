<?php

namespace App\Http\Controllers\Integrations;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Services\Intelimotor\IntelimotorApiService;
use App\Services\Intelimotor\IntelimotorIntegrationException;
use App\Services\Intelimotor\IntelimotorInventorySyncService;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntelimotorIntegrationController extends Controller
{
    public function __construct(
        private IntelimotorApiService $intelimotorApiService,
        private IntelimotorInventorySyncService $intelimotorInventorySyncService
    ) {}

    public function showSettings(): JsonResponse
    {
        $settings = $this->intelimotorApiService->getSettings();

        return ApiResponseHelper::apiSuccess(
            200,
            'Configuración de Intelimotor',
            $this->intelimotorApiService->toPublicSettings($settings)
        );
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'api_key' => 'nullable|string|max:512',
            'api_secret' => 'nullable|string|max:512',
            'business_unit_id' => 'nullable|string|max:128',
            'base_url' => 'nullable|url|max:255',
            'is_enabled' => 'nullable|boolean',
        ]);

        $settings = $this->intelimotorApiService->updateSettings($validated);

        return ApiResponseHelper::apiSuccess(
            200,
            'Configuración actualizada',
            $this->intelimotorApiService->toPublicSettings($settings)
        );
    }

    public function testConnection(): JsonResponse
    {
        try {
            $result = $this->intelimotorApiService->testConnection();

            return ApiResponseHelper::apiSuccess(200, 'Conexión verificada con Intelimotor', $result);
        } catch (IntelimotorIntegrationException $exception) {
            return ApiResponseHelper::apiError($exception->getMessage(), null, $exception->status());
        }
    }

    public function getUnits(Request $request): JsonResponse
    {
        try {
            $result = $this->intelimotorApiService->getInventoryUnits($request->query());

            return ApiResponseHelper::apiSuccess(200, 'Inventario obtenido de Intelimotor', $result);
        } catch (IntelimotorIntegrationException $exception) {
            return ApiResponseHelper::apiError($exception->getMessage(), null, $exception->status());
        }
    }

    public function getUnit(string $unitId): JsonResponse
    {
        try {
            $result = $this->intelimotorApiService->getUnit($unitId);

            return ApiResponseHelper::apiSuccess(200, 'Unidad obtenida de Intelimotor', $result);
        } catch (IntelimotorIntegrationException $exception) {
            return ApiResponseHelper::apiError($exception->getMessage(), null, $exception->status());
        }
    }

    public function createUnit(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'businessUnitId' => 'nullable|string|max:128',
            'ref' => 'nullable|string|max:128',
            'vin' => 'nullable|string|max:128',
            'brandIds' => 'nullable|array',
            'brandIds.*' => 'string|max:128',
            'modelIds' => 'nullable|array',
            'modelIds.*' => 'string|max:128',
            'yearIds' => 'nullable|array',
            'yearIds.*' => 'string|max:128',
            'trimIds' => 'nullable|array',
            'trimIds.*' => 'string|max:128',
            'useCustomTrim' => 'nullable|boolean',
            'customTrim' => 'nullable|string|max:255',
            'kms' => 'nullable|integer|min:0',
            'type' => 'nullable|string|in:owned,exchanged,demo,new,consigned',
            'consignmentFeeType' => 'nullable|string',
            'consignmentFee' => 'nullable|numeric|min:0',
            'buyPrice' => 'nullable|numeric|min:0',
            'buyDate' => 'nullable|integer',
            'listPrice' => 'nullable|numeric|min:0',
            'pictures' => 'nullable|array',
            'pictureUrls' => 'nullable|array',
            'customValues' => 'nullable|array',
            'useExternalCatalog' => 'nullable|boolean',
            'externalBrand' => 'nullable|string|max:255',
            'externalModel' => 'nullable|string|max:255',
            'externalYear' => 'nullable|string|max:32',
            'externalTrim' => 'nullable|string|max:255',
        ]);

        try {
            $result = $this->intelimotorApiService->createUnit($payload);

            return ApiResponseHelper::apiSuccess(200, 'Unidad enviada a Intelimotor', $result);
        } catch (IntelimotorIntegrationException $exception) {
            return ApiResponseHelper::apiError($exception->getMessage(), null, $exception->status());
        }
    }

    public function syncInventory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sync_images' => 'nullable|boolean',
        ]);

        try {
            $summary = $this->intelimotorInventorySyncService->syncInventory(
                (bool) ($validated['sync_images'] ?? true)
            );

            return ApiResponseHelper::apiSuccess(200, 'Inventario sincronizado desde Intelimotor', $summary);
        } catch (IntelimotorIntegrationException $exception) {
            return ApiResponseHelper::apiError($exception->getMessage(), null, $exception->status());
        }
    }

    public function linkedVehicles(): JsonResponse
    {
        $vehicles = $this->intelimotorInventorySyncService->listLinkedVehicles();

        return ApiResponseHelper::apiSuccess(200, 'Vehículos vinculados a Intelimotor', $vehicles);
    }

    public function pushVehiclePhotos(string $vehicleUuid): JsonResponse
    {
        $vehicle = Vehicle::query()->where('uuid', $vehicleUuid)->first();

        if (! $vehicle) {
            return ApiResponseHelper::apiError('Vehículo no encontrado.', null, 404);
        }

        try {
            $result = $this->intelimotorInventorySyncService->pushVehiclePhotos($vehicle);

            return ApiResponseHelper::apiSuccess(200, 'Fotos enviadas a Intelimotor', $result);
        } catch (IntelimotorIntegrationException $exception) {
            return ApiResponseHelper::apiError($exception->getMessage(), null, $exception->status());
        }
    }
}
