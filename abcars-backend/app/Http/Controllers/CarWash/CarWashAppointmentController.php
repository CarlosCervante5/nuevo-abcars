<?php

namespace App\Http\Controllers\CarWash;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Models\CarWash\CarWashAppointment;
use App\Models\CarWash\CarWashLocation;
use App\Services\CarWash\CarWashAppointmentService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CarWashAppointmentController extends Controller
{
    public function __construct(private CarWashAppointmentService $appointments) {}

    public function index(Request $request)
    {
        try {
            $query = CarWashAppointment::query()
                ->with(['location', 'serviceType', 'bay', 'washer'])
                ->orderByDesc('scheduled_start_at');

            if ($request->filled('status')) {
                $query->where('status', $request->string('status'));
            }

            if ($request->filled('location_uuid')) {
                $location = CarWashLocation::findByUuid($request->string('location_uuid'));
                if ($location) {
                    $query->where('location_id', $location->id);
                }
            }

            if ($request->filled('date')) {
                $day = Carbon::parse($request->string('date'));
                $query->whereBetween('scheduled_start_at', [
                    $day->copy()->startOfDay(),
                    $day->copy()->endOfDay(),
                ]);
            }

            if ($request->filled('phone')) {
                $query->where('customer_phone', 'like', '%'.$request->string('phone').'%');
            }

            $perPage = min(100, max(1, (int) $request->input('per_page', 20)));

            return ApiResponseHelper::apiSuccess(200, 'Citas CarWash', $query->paginate($perPage));
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al listar citas CarWash', $e->getMessage(), 500, 'CARWASH_APPOINTMENTS_LIST');
        }
    }

    public function board(Request $request)
    {
        try {
            $date = Carbon::parse($request->input('date', now()->toDateString()));
            $query = CarWashAppointment::query()
                ->with(['location', 'serviceType', 'bay', 'washer'])
                ->whereBetween('scheduled_start_at', [
                    $date->copy()->startOfDay(),
                    $date->copy()->endOfDay(),
                ])
                ->whereNotIn('status', ['cancelled'])
                ->orderBy('scheduled_start_at');

            if ($request->filled('location_uuid')) {
                $location = CarWashLocation::findByUuid($request->string('location_uuid'));
                if ($location) {
                    $query->where('location_id', $location->id);
                }
            }

            $items = $query->get();
            $byStatus = [];
            foreach (CarWashAppointment::STATUSES as $status) {
                $byStatus[$status] = $items->where('status', $status)->values();
            }

            return ApiResponseHelper::apiSuccess(200, 'Tablero CarWash', [
                'date' => $date->toDateString(),
                'total' => $items->count(),
                'by_status' => $byStatus,
                'items' => $items,
            ]);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener tablero CarWash', $e->getMessage(), 500, 'CARWASH_BOARD');
        }
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'location_uuid' => 'required|string',
                'service_type_uuid' => 'required|string',
                'bay_uuid' => 'nullable|string',
                'washer_uuid' => 'nullable|string',
                'customer_name' => 'required|string|max:255',
                'customer_phone' => 'required|string|max:32',
                'vehicle_plates' => 'nullable|string|max:32',
                'vehicle_brand' => 'nullable|string|max:100',
                'vehicle_model' => 'nullable|string|max:100',
                'vehicle_color' => 'nullable|string|max:50',
                'scheduled_start_at' => 'required|date',
                'scheduled_end_at' => 'nullable|date|after:scheduled_start_at',
                'notes' => 'nullable|string',
                'channel' => 'nullable|string|max:32',
                'quoted_price' => 'nullable|numeric|min:0',
            ]);

            $appointment = $this->appointments->create($data, auth()->id());

            return ApiResponseHelper::apiSuccess(201, 'Cita CarWash creada', $appointment);
        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear cita CarWash', $e->getMessage(), 500, 'CARWASH_APPOINTMENT_CREATE');
        }
    }

    public function show(string $uuid)
    {
        try {
            $appointment = CarWashAppointment::with(['location', 'serviceType', 'bay', 'washer', 'statusLogs'])
                ->where('uuid', $uuid)
                ->first();

            if (! $appointment) {
                return ApiResponseHelper::apiError('Cita no encontrada', null, 404, 'CARWASH_APPOINTMENT_NOT_FOUND');
            }

            return ApiResponseHelper::apiSuccess(200, 'Cita CarWash', $appointment);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener cita CarWash', $e->getMessage(), 500, 'CARWASH_APPOINTMENT_SHOW');
        }
    }

    public function updateStatus(Request $request, string $uuid)
    {
        try {
            $data = $request->validate([
                'status' => ['required', 'string', Rule::in(CarWashAppointment::STATUSES)],
            ]);

            $appointment = CarWashAppointment::findByUuid($uuid);
            if (! $appointment) {
                return ApiResponseHelper::apiError('Cita no encontrada', null, 404, 'CARWASH_APPOINTMENT_NOT_FOUND');
            }

            $updated = $this->appointments->changeStatus($appointment, $data['status'], auth()->id(), 'admin');

            return ApiResponseHelper::apiSuccess(200, 'Estatus actualizado', $updated);
        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al actualizar estatus', $e->getMessage(), 500, 'CARWASH_APPOINTMENT_STATUS');
        }
    }
}
