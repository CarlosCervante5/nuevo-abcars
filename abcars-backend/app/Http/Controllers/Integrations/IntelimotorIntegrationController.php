<?php

namespace App\Http\Controllers\Integrations;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Services\Intelimotor\IntelimotorAccountService;
use App\Services\Intelimotor\IntelimotorApiService;
use App\Services\Intelimotor\IntelimotorIntegrationException;
use App\Services\Intelimotor\IntelimotorInventorySyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntelimotorIntegrationController extends Controller
{
    public function __construct(
        private IntelimotorApiService $intelimotorApiService,
        private IntelimotorAccountService $accountService,
        private IntelimotorInventorySyncService $intelimotorInventorySyncService
    ) {}

    public function listAccounts(): JsonResponse
    {
        $accounts = $this->accountService->listAccounts()
            ->map(fn ($account) => $account->toPublicArray())
            ->values()
            ->all();

        return ApiResponseHelper::apiSuccess(200, 'Cuentas Intelimotor', $accounts);
    }

    public function storeAccount(Request $request): JsonResponse
    {
        $validated = $this->validateAccountPayload($request, true);

        $account = $this->accountService->createAccount($validated);

        return ApiResponseHelper::apiSuccess(201, 'Cuenta Intelimotor creada', $account->toPublicArray());
    }

    public function updateAccount(Request $request, string $accountUuid): JsonResponse
    {
        $validated = $this->validateAccountPayload($request, false);
        $account = $this->accountService->updateAccount(
            $this->accountService->findByUuid($accountUuid),
            $validated
        );

        return ApiResponseHelper::apiSuccess(200, 'Cuenta actualizada', $account->toPublicArray());
    }

    public function deleteAccount(string $accountUuid): JsonResponse
    {
        $account = $this->accountService->findByUuid($accountUuid);
        $this->accountService->deleteAccount($account);

        return ApiResponseHelper::apiSuccess(200, 'Cuenta eliminada', null);
    }

    public function testAccountConnection(string $accountUuid): JsonResponse
    {
        try {
            $account = $this->accountService->findByUuid($accountUuid);
            $result = $this->intelimotorApiService->testConnection($account);

            return ApiResponseHelper::apiSuccess(200, 'Conexión verificada con Intelimotor', $result);
        } catch (IntelimotorIntegrationException $exception) {
            return ApiResponseHelper::apiError($exception->getMessage(), null, $exception->status());
        }
    }

    public function getAccountUnits(Request $request, string $accountUuid): JsonResponse
    {
        try {
            $account = $this->accountService->findByUuid($accountUuid);
            $result = $this->intelimotorApiService->getInventoryUnits($request->query(), $account);

            return ApiResponseHelper::apiSuccess(200, 'Inventario obtenido de Intelimotor', $result);
        } catch (IntelimotorIntegrationException $exception) {
            return ApiResponseHelper::apiError($exception->getMessage(), null, $exception->status());
        }
    }

    public function getUnit(Request $request, string $unitId): JsonResponse
    {
        try {
            $accountUuid = $request->query('account_uuid');
            $account = $accountUuid
                ? $this->accountService->findByUuid((string) $accountUuid)
                : $this->accountService->enabledAccounts()->first();

            if (! $account) {
                throw new IntelimotorIntegrationException('No hay cuentas Intelimotor configuradas.', 422);
            }

            $result = $this->intelimotorApiService->getUnit($unitId, $account);

            return ApiResponseHelper::apiSuccess(200, 'Unidad obtenida de Intelimotor', $result);
        } catch (IntelimotorIntegrationException $exception) {
            return ApiResponseHelper::apiError($exception->getMessage(), null, $exception->status());
        }
    }

    public function createUnit(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'account_uuid' => 'nullable|string|max:64',
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
            $accountUuid = $payload['account_uuid'] ?? null;
            unset($payload['account_uuid']);

            $account = $accountUuid
                ? $this->accountService->findByUuid($accountUuid)
                : $this->accountService->enabledAccounts()->first();

            if (! $account) {
                throw new IntelimotorIntegrationException('No hay cuentas Intelimotor configuradas.', 422);
            }

            $result = $this->intelimotorApiService->createUnit($payload, $account);

            return ApiResponseHelper::apiSuccess(200, 'Unidad enviada a Intelimotor', $result);
        } catch (IntelimotorIntegrationException $exception) {
            return ApiResponseHelper::apiError($exception->getMessage(), null, $exception->status());
        }
    }

    public function syncInventory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sync_images' => 'nullable|boolean',
            'account_uuid' => 'nullable|string|max:64',
        ]);

        try {
            $summary = $this->intelimotorInventorySyncService->syncInventory(
                (bool) ($validated['sync_images'] ?? true),
                $validated['account_uuid'] ?? null
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

    private function validateAccountPayload(Request $request, bool $creating): array
    {
        return $request->validate([
            'name' => ($creating ? 'required' : 'sometimes') . '|string|max:120',
            'api_key' => 'nullable|string|max:512',
            'api_secret' => 'nullable|string|max:512',
            'business_unit_id' => 'nullable|string|max:128',
            'default_dealership_id' => 'nullable|integer|min:1',
            'base_url' => 'nullable|url|max:255',
            'is_enabled' => 'nullable|boolean',
        ]);
    }
}
