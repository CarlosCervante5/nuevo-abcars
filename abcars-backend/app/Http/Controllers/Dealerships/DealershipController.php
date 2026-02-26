<?php

namespace App\Http\Controllers\Dealerships;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dealerships\StoreDealershipRequest;
use App\Http\Requests\Dealerships\UpdateDealershipRequest;
use App\Models\Dealership;

class DealershipController extends Controller
{
    public function search()
    {
        try {
            $dealerships = Dealership::all();
            return ApiResponseHelper::authSuccess(200, 'Sucursales encontradas', $dealerships);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener las sucursales', $e->getMessage(), 500, 'GET_DEALERSHIPS_ERROR');
        }
    }

    public function index()
    {
        try {
            $dealerships = Dealership::orderBy('name')->get();
            return ApiResponseHelper::authSuccess(200, 'Sucursales encontradas', $dealerships);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener las sucursales', $e->getMessage(), 500, 'GET_DEALERSHIPS_ERROR');
        }
    }

    public function show(int $id)
    {
        try {
            $dealership = Dealership::find($id);
            if (!$dealership) {
                return ApiResponseHelper::apiError('Sucursal no encontrada', null, 404, 'DEALERSHIP_NOT_FOUND');
            }
            return ApiResponseHelper::authSuccess(200, 'Sucursal encontrada', $dealership);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener la sucursal', $e->getMessage(), 500, 'GET_DEALERSHIP_ERROR');
        }
    }

    public function store(StoreDealershipRequest $request)
    {
        try {
            $dealership = Dealership::create($request->validated());
            return ApiResponseHelper::authSuccess(201, 'Sucursal creada correctamente', $dealership);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear la sucursal', $e->getMessage(), 500, 'CREATE_DEALERSHIP_ERROR');
        }
    }

    public function update(UpdateDealershipRequest $request, int $id)
    {
        try {
            $dealership = Dealership::find($id);
            if (!$dealership) {
                return ApiResponseHelper::apiError('Sucursal no encontrada', null, 404, 'DEALERSHIP_NOT_FOUND');
            }
            $dealership->update($request->validated());
            return ApiResponseHelper::authSuccess(200, 'Sucursal actualizada correctamente', $dealership);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al actualizar la sucursal', $e->getMessage(), 500, 'UPDATE_DEALERSHIP_ERROR');
        }
    }

    public function destroy(int $id)
    {
        try {
            $dealership = Dealership::find($id);
            if (!$dealership) {
                return ApiResponseHelper::apiError('Sucursal no encontrada', null, 404, 'DEALERSHIP_NOT_FOUND');
            }
            $dealership->delete();
            return ApiResponseHelper::authSuccess(200, 'Sucursal eliminada correctamente');
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al eliminar la sucursal', $e->getMessage(), 500, 'DELETE_DEALERSHIP_ERROR');
        }
    }
}
