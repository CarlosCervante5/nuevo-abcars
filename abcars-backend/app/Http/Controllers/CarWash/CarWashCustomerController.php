<?php

namespace App\Http\Controllers\CarWash;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Models\CarWash\CarWashCustomer;
use App\Services\CarWash\CarWashCustomerService;
use Illuminate\Http\Request;

class CarWashCustomerController extends Controller
{
    public function __construct(private CarWashCustomerService $customers) {}

    public function index()
    {
        try {
            if (! $this->customers->tablesReady()) {
                return ApiResponseHelper::apiSuccess(200, 'Clientes CarWash', [
                    'tables_ready' => false,
                    'customers' => [],
                ]);
            }

            $rows = CarWashCustomer::query()
                ->orderByDesc('last_delivered_at')
                ->limit(200)
                ->get();

            return ApiResponseHelper::apiSuccess(200, 'Clientes CarWash', [
                'tables_ready' => true,
                'customers' => $rows,
            ]);
        } catch (\Throwable $e) {
            return ApiResponseHelper::apiError('Error al listar clientes', $e->getMessage(), 500, 'CARWASH_CUSTOMERS');
        }
    }

    public function syncDelivered()
    {
        try {
            $result = $this->customers->syncFromDeliveredAppointments();

            return ApiResponseHelper::apiSuccess(200, 'Clientes sincronizados desde citas entregadas', $result);
        } catch (\Throwable $e) {
            return ApiResponseHelper::apiError('Error al sincronizar clientes', $e->getMessage(), 500, 'CARWASH_CUSTOMERS_SYNC');
        }
    }

    public function sendRebookOffers(Request $request)
    {
        try {
            $data = $request->validate([
                'force' => 'sometimes|boolean',
                'limit' => 'sometimes|integer|min:1|max:100',
                'cooldown_hours' => 'sometimes|integer|min:0|max:720',
                'min_hours_since_delivered' => 'sometimes|integer|min:0|max:720',
                'phones' => 'sometimes|array',
                'phones.*' => 'string|max:32',
            ]);

            // Primero sincroniza delivered → customers
            $this->customers->syncFromDeliveredAppointments();
            $result = $this->customers->sendRebookOffers($data);

            return ApiResponseHelper::apiSuccess(200, 'Ofertas de rebook enviadas', $result);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Throwable $e) {
            return ApiResponseHelper::apiError('Error al enviar ofertas', $e->getMessage(), 500, 'CARWASH_REBOOK');
        }
    }
}
