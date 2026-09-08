<?php

namespace App\Http\Controllers\CarWash;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Models\CarWash\CarWashBay;
use App\Models\CarWash\CarWashLocation;
use App\Models\CarWash\CarWashProduct;
use App\Models\CarWash\CarWashServiceType;
use App\Models\CarWash\CarWashWasher;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CarWashCatalogController extends Controller
{
    public function locations(Request $request)
    {
        $query = CarWashLocation::query()->orderBy('name');
        if (! $request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }

        return ApiResponseHelper::apiSuccess(200, 'Sedes CarWash', $query->get());
    }

    public function storeLocation(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'nullable|string|max:50',
                'dealership_id' => 'nullable|integer',
                'phone' => 'nullable|string|max:32',
                'address' => 'nullable|string|max:500',
                'is_active' => 'nullable|boolean',
                'open_hours' => 'nullable|array',
            ]);

            $location = CarWashLocation::create($data);

            return ApiResponseHelper::apiSuccess(201, 'Sede creada', $location);
        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear sede', $e->getMessage(), 500, 'CARWASH_LOCATION_CREATE');
        }
    }

    public function serviceTypes(Request $request)
    {
        $query = CarWashServiceType::query()->orderBy('sort_order')->orderBy('name');
        if (! $request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }

        return ApiResponseHelper::apiSuccess(200, 'Servicios CarWash', $query->get());
    }

    public function storeServiceType(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:50',
                'description' => 'nullable|string',
                'duration_minutes' => 'required|integer|min:5|max:480',
                'price' => 'required|numeric|min:0',
                'is_active' => 'nullable|boolean',
                'sort_order' => 'nullable|integer|min:0',
            ]);

            if (CarWashServiceType::query()->where('code', $data['code'])->exists()) {
                return ApiResponseHelper::apiError('Ya existe un servicio con ese código', null, 422, 'CARWASH_SERVICE_CODE_EXISTS');
            }

            $service = CarWashServiceType::create($data);

            return ApiResponseHelper::apiSuccess(201, 'Servicio creado', $service);
        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear servicio', $e->getMessage(), 500, 'CARWASH_SERVICE_CREATE');
        }
    }

    public function updateServiceType(Request $request, string $uuid)
    {
        try {
            $service = CarWashServiceType::findByUuid($uuid);
            if (! $service) {
                return ApiResponseHelper::apiError('Servicio no encontrado', null, 404, 'CARWASH_SERVICE_NOT_FOUND');
            }

            $data = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'code' => 'sometimes|required|string|max:50',
                'description' => 'nullable|string',
                'duration_minutes' => 'sometimes|required|integer|min:5|max:1440',
                'price' => 'sometimes|required|numeric|min:0',
                'is_active' => 'nullable|boolean',
                'sort_order' => 'nullable|integer|min:0',
            ]);

            if (isset($data['code']) && $data['code'] !== $service->code) {
                if (CarWashServiceType::query()->where('code', $data['code'])->where('id', '!=', $service->id)->exists()) {
                    return ApiResponseHelper::apiError('Ya existe un servicio con ese código', null, 422, 'CARWASH_SERVICE_CODE_EXISTS');
                }
            }

            $service->fill($data);
            $service->save();

            return ApiResponseHelper::apiSuccess(200, 'Servicio actualizado', $service->fresh());
        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al actualizar servicio', $e->getMessage(), 500, 'CARWASH_SERVICE_UPDATE');
        }
    }

    public function destroyServiceType(string $uuid)
    {
        try {
            $service = CarWashServiceType::findByUuid($uuid);
            if (! $service) {
                return ApiResponseHelper::apiError('Servicio no encontrado', null, 404, 'CARWASH_SERVICE_NOT_FOUND');
            }

            $service->delete();

            return ApiResponseHelper::apiSuccess(200, 'Servicio eliminado', ['uuid' => $uuid]);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al eliminar servicio', $e->getMessage(), 500, 'CARWASH_SERVICE_DELETE');
        }
    }

    public function washers(Request $request)
    {
        $query = CarWashWasher::query()->with('location')->orderBy('display_name');
        if (! $request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }
        if ($request->filled('location_uuid')) {
            $location = CarWashLocation::findByUuid($request->string('location_uuid'));
            if ($location) {
                $query->where('location_id', $location->id);
            }
        }

        return ApiResponseHelper::apiSuccess(200, 'Lavadores', $query->get());
    }

    public function storeWasher(Request $request)
    {
        try {
            $data = $request->validate([
                'display_name' => 'required|string|max:255',
                'phone' => 'nullable|string|max:32',
                'user_id' => 'nullable|integer',
                'location_uuid' => 'nullable|string',
                'is_active' => 'nullable|boolean',
            ]);

            $locationId = null;
            if (! empty($data['location_uuid'])) {
                $location = CarWashLocation::findByUuid($data['location_uuid']);
                $locationId = $location?->id;
            }

            $washer = CarWashWasher::create([
                'display_name' => $data['display_name'],
                'phone' => $data['phone'] ?? null,
                'user_id' => $data['user_id'] ?? null,
                'location_id' => $locationId,
                'is_active' => $data['is_active'] ?? true,
            ]);

            return ApiResponseHelper::apiSuccess(201, 'Lavador creado', $washer->load('location'));
        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear lavador', $e->getMessage(), 500, 'CARWASH_WASHER_CREATE');
        }
    }

    public function products(Request $request)
    {
        $query = CarWashProduct::query()->orderBy('name');
        if (! $request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }

        return ApiResponseHelper::apiSuccess(200, 'Productos amenidades', $query->get());
    }

    public function storeProduct(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'sku' => 'nullable|string|max:64',
                'description' => 'nullable|string',
                'price' => 'required|numeric|min:0',
                'stock' => 'nullable|integer|min:0',
                'is_active' => 'nullable|boolean',
            ]);

            $product = CarWashProduct::create($data);

            return ApiResponseHelper::apiSuccess(201, 'Producto creado', $product);
        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear producto', $e->getMessage(), 500, 'CARWASH_PRODUCT_CREATE');
        }
    }

    public function bays(Request $request)
    {
        $query = CarWashBay::query()->with('location')->orderBy('name');
        if (! $request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }
        if ($request->filled('location_uuid')) {
            $location = CarWashLocation::findByUuid($request->string('location_uuid'));
            if ($location) {
                $query->where('location_id', $location->id);
            }
        }

        return ApiResponseHelper::apiSuccess(200, 'Bahías', $query->get());
    }

    public function storeBay(Request $request)
    {
        try {
            $data = $request->validate([
                'location_uuid' => 'required|string',
                'name' => 'required|string|max:255',
                'code' => 'nullable|string|max:50',
                'is_active' => 'nullable|boolean',
            ]);

            $location = CarWashLocation::findByUuid($data['location_uuid']);
            if (! $location) {
                return ApiResponseHelper::apiError('Sede no encontrada', null, 404, 'CARWASH_LOCATION_NOT_FOUND');
            }

            $bay = CarWashBay::create([
                'location_id' => $location->id,
                'name' => $data['name'],
                'code' => $data['code'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            return ApiResponseHelper::apiSuccess(201, 'Bahía creada', $bay->load('location'));
        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear bahía', $e->getMessage(), 500, 'CARWASH_BAY_CREATE');
        }
    }
}
