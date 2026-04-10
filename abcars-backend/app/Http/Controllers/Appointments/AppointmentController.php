<?php

namespace App\Http\Controllers\Appointments;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Appointments\AttatchAppointmentRequest;
use App\Http\Requests\Appointments\StoreAppointmentRequest;
use App\Http\Requests\Riders\SearchRiderRequest;
use App\Models\CustomerAppointment;
use App\Models\User;
use App\Services\AppointmentService;
use App\Services\ValuationService;
use Illuminate\Validation\ValidationException;


class AppointmentController extends Controller
{

    protected $appointmentService;
    protected $valuationService;

    public function __construct(AppointmentService $appointmentService, ValuationService $valuationService)
    {
        $this->appointmentService = $appointmentService;
        $this->valuationService = $valuationService;
    }

    /**
     * Obtener una lista de todas las citas
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function search(SearchRiderRequest $request)
    {
        try {
            $data = $request->validated();
            $perPage = (int) ($data['paginate'] ?? 15);

            $authUser = auth()->user();
            $isSeller = $authUser && $authUser->hasRole('seller');

            $query = CustomerAppointment::query()
                ->with([
                    'customer',
                    'vehicle',
                    'valuation.valuator' => function ($q) {
                        $q->with('userProfile');
                    },
                ]);

            // Vendedor: todas las citas atribuidas por referido (cualquier tipo). El filtro type=valuation ocultaba filas si el tipo no coincidía exactamente.
            if ($isSeller) {
                $query->where('referrer_user_id', $authUser->id);
            } else {
                $query->when(! empty($data['type']), function ($q) use ($data) {
                    $q->where('type', $data['type']);
                });
            }

            if (! empty($data['keyword'])) {
                $keyword = '%' . $data['keyword'] . '%';
                $query->where(function ($q) use ($keyword) {
                    $q->whereHas('customer', function ($c) use ($keyword) {
                        $c->where('name', 'LIKE', $keyword)
                            ->orWhere('last_name', 'LIKE', $keyword)
                            ->orWhere('phone_1', 'LIKE', $keyword);
                    })->orWhereHas('vehicle', function ($v) use ($keyword) {
                        $v->where('brand_name', 'LIKE', $keyword)
                            ->orWhere('model_name', 'LIKE', $keyword);
                    });
                });
            }

            $paginator = $query->orderByDesc('id')->paginate($perPage);

            $paginator->setCollection(
                $paginator->getCollection()->map(function (CustomerAppointment $a) {
                    $c = $a->customer;
                    $v = $a->vehicle;
                    $valuator = $a->valuation?->valuator->first();
                    $profile = $valuator?->userProfile;

                    return (object) [
                        'phone_1' => (string) ($c?->phone_1 ?? ''),
                        'customer_name' => (string) ($c?->name ?? ''),
                        'customer_lastname' => (string) ($c?->last_name ?? ''),
                        'vehicle_brandname' => (string) ($v?->brand_name ?? ''),
                        'vehicle_modelname' => (string) ($v?->model_name ?? ''),
                        'vehicle_mileage' => (int) ($v?->mileage ?? 0),
                        'vehicle_year' => (string) ($v?->year ?? ''),
                        'appointment_uuid' => (string) ($a->uuid ?? ''),
                        'dealership_name' => (string) ($a->dealership_name ?? ''),
                        'appointment_type' => (string) ($a->type ?? ''),
                        'appointment_scheduled_date' => (string) ($a->scheduled_date ?? ''),
                        'valuator_name' => (string) ($profile->name ?? ''),
                        'valuator_last_name' => (string) ($profile->last_name ?? ''),
                        'valuator_uuid' => (string) ($valuator->uuid ?? ''),
                    ];
                })
            );

            return ApiResponseHelper::apiSuccess(200, 'Citas obtenidas exitosamente', ['appointments' => $paginator]);
        } catch (\Throwable $e) {
            report($e);

            return ApiResponseHelper::apiError(
                'Error al obtener la lista de citas',
                config('app.debug') ? $e->getMessage() : null,
                500,
                'GET_APPOINTMENTS_ERROR'
            );
        }
    }


    /**
     * Crear cita para valuación
     *
     * @param  \App\Http\Requests\Users\StoreAppointmentRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function valuationAppointment(StoreAppointmentRequest $request)
    {
        try {

            $data = $request->validated();

            $user = auth()->user();

            $appointment = $this->appointmentService->createAppointment($data);

            $this->valuationService->createValuation($appointment, $user);
            
            return ApiResponseHelper::apiSuccess(201, 'Cita de valuacion creada exitosamente');

        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear la cita de valuacion', $e->getMessage(), 500, 'CREATE_VALUATION_APPOINTMENT_ERROR');
        }
    }

    /**
     * Asociar cita con valuacion y valuador
     *
     * @param  \App\Http\Requests\Users\AttatchAppointmentRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function attatchValuator(AttatchAppointmentRequest $request)
    {
        try {

            $data = $request->validated();

            $appointment = CustomerAppointment::findByUuid($data['appointment_uuid']);

            if (!$appointment) {
                return ApiResponseHelper::authError('La cita proporcionada no se encuentra', null, 401, 'GET_APPOINTMENT_ERROR');
            }

            $user = User::findByUuid($data['valuator_uuid']);

            if (!$user) {
                return ApiResponseHelper::authError('El usuario no se encuentra registrado', null, 401, 'GET_USER_ERROR');
            }

            $valuation = $appointment->valuation()->first();

            if(!$valuation){

              $valuation =  $this->valuationService->createValuation($appointment, $user);

            } else {

                $roleProfile = $user->getRoleProfile();
                $role = $roleProfile['role'];

                $valuation->valuator()->detach();

                $valuation->valuator()->attach($user->id, ['user_role_name' => $role]);
            }

            return ApiResponseHelper::apiSuccess(201, 'Cita de asociada exitosamente');

        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear la cita de valuacion', $e->getMessage(), 500, 'CREATE_VALUATION_APPOINTMENT_ERROR');
        }
    }

    /**
     * Crear cita
     *
     * @param  \App\Http\Requests\Users\StoreAppointmentRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(StoreAppointmentRequest $request)
    {
        try {

            $data = $request->validated();

            $this->appointmentService->createAppointment($data);

            return ApiResponseHelper::apiSuccess(201, 'Cita creada exitosamente');

        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear la cita', $e->getMessage(), 500, 'CREATE_APPOINTMENT_ERROR');
        }
    }
}
