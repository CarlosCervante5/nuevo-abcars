<?php

namespace App\Http\Controllers\CarWash;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Models\CarWash\CarWashLocation;
use App\Models\CarWash\CarWashOrder;
use App\Services\CarWash\CarWashPosService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CarWashPosController extends Controller
{
    public function __construct(private CarWashPosService $pos) {}

    public function index(Request $request)
    {
        try {
            $query = CarWashOrder::query()
                ->with(['items', 'location', 'appointment'])
                ->orderByDesc('paid_at')
                ->orderByDesc('id');

            if ($request->filled('location_uuid')) {
                $location = CarWashLocation::findByUuid($request->string('location_uuid'));
                if ($location) {
                    $query->where('location_id', $location->id);
                }
            }

            if ($request->filled('status')) {
                $query->where('status', $request->string('status'));
            }

            $perPage = min(100, max(1, (int) $request->input('per_page', 20)));

            return ApiResponseHelper::apiSuccess(200, 'Órdenes POS', $query->paginate($perPage));
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al listar órdenes', $e->getMessage(), 500, 'CARWASH_POS_LIST');
        }
    }

    public function show(string $uuid)
    {
        $order = CarWashOrder::query()
            ->with(['items', 'location', 'appointment.serviceType'])
            ->where('uuid', $uuid)
            ->first();

        if (! $order) {
            return ApiResponseHelper::apiError('Orden no encontrada', null, 404, 'CARWASH_ORDER_NOT_FOUND');
        }

        return ApiResponseHelper::apiSuccess(200, 'Orden POS', $order);
    }

    public function checkout(Request $request)
    {
        try {
            $data = $request->validate([
                'location_uuid' => 'required|string',
                'appointment_uuid' => 'nullable|string',
                'customer_name' => 'nullable|string|max:255',
                'customer_phone' => 'nullable|string|max:32',
                'payment_method' => ['required', 'string', Rule::in(CarWashPosService::PAYMENT_METHODS)],
                'notes' => 'nullable|string|max:2000',
                'items' => 'required|array|min:1',
                'items.*.item_type' => ['required', 'string', Rule::in(['service', 'product'])],
                'items.*.uuid' => 'required|string',
                'items.*.quantity' => 'nullable|integer|min:1|max:100',
            ]);

            $order = $this->pos->checkout($data, $request->user()?->id);

            return ApiResponseHelper::apiSuccess(201, 'Cobro registrado', $order);
        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error en checkout POS', $e->getMessage(), 422, 'CARWASH_POS_CHECKOUT');
        }
    }
}
