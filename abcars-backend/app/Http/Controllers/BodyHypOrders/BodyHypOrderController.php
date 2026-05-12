<?php

namespace App\Http\Controllers\BodyHypOrders;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\BodyHypOrders\IndexBodyHypOrderRequest;
use App\Http\Requests\BodyHypOrders\StoreBodyHypOrderRequest;
use App\Models\BodyHypOrder;

class BodyHypOrderController extends Controller
{
    public function index(IndexBodyHypOrderRequest $request)
    {
        try {
            $validated = $request->validated();
            $perPage = (int) ($validated['per_page'] ?? 15);
            $page = (int) ($validated['page'] ?? 1);

            $query = BodyHypOrder::query()
                ->where('user_id', $request->user()->id)
                ->orderByDesc('id');

            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            return ApiResponseHelper::apiSuccess(200, 'Órdenes HyP', $paginator);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al listar órdenes', $e->getMessage(), 500, 'BODY_HYP_LIST_ERROR');
        }
    }

    public function store(StoreBodyHypOrderRequest $request)
    {
        try {
            $data = $request->validated();

            $order = BodyHypOrder::create([
                'user_id' => $request->user()->id,
                'title' => $data['title'] ?? null,
                'description' => $data['description'],
                'status' => 'open',
            ]);

            return ApiResponseHelper::apiSuccess(201, 'Orden HyP creada', $order);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear la orden', $e->getMessage(), 500, 'BODY_HYP_CREATE_ERROR');
        }
    }
}
