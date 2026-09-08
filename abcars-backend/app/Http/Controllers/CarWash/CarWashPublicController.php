<?php

namespace App\Http\Controllers\CarWash;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Models\CarWash\CarWashAppointment;
use App\Services\CarWash\CarWashLoyaltyService;
use App\Services\CarWash\WhatsApp\CarWashPhoneNormalizer;
use Illuminate\Http\Request;

class CarWashPublicController extends Controller
{
    public function __construct(private CarWashLoyaltyService $loyalty) {}

    /**
     * Vista cliente (app móvil): cita activa + timeline + cuponera por teléfono.
     * GET /api/carwash/public/customer-status?phone=8129161594
     */
    public function customerStatus(Request $request)
    {
        try {
            $phoneRaw = (string) $request->query('phone', '');
            $phone = CarWashPhoneNormalizer::e164($phoneRaw);
            $digits = preg_replace('/\D+/', '', $phoneRaw) ?? '';
            $last10 = strlen($digits) >= 10 ? substr($digits, -10) : $digits;

            if ($phone === '' && $last10 === '') {
                return ApiResponseHelper::apiError('Indica tu teléfono', null, 422, 'CARWASH_PUBLIC_PHONE');
            }

            $uuid = trim((string) $request->query('appointment_uuid', ''));

            $query = CarWashAppointment::query()
                ->with(['location', 'serviceType', 'statusLogs'])
                ->where(function ($q) use ($phone, $last10) {
                    if ($phone !== '') {
                        $q->where('customer_phone', $phone)
                            ->orWhere('customer_phone', 'like', '%'.$last10);
                    } else {
                        $q->where('customer_phone', 'like', '%'.$last10);
                    }
                })
                ->where('order_type', '!=', 'internal_sales_delivery')
                ->orderByDesc('scheduled_start_at');

            if ($uuid !== '') {
                $query->where('uuid', $uuid);
            }

            $appointments = $query->limit(8)->get();

            $active = $appointments->first(function (CarWashAppointment $a) {
                return ! in_array($a->status, ['delivered', 'cancelled', 'no_show'], true);
            }) ?? $appointments->first();

            $loyalty = $this->loyalty->lookupByPhone($phone !== '' ? $phone : $last10);

            $timelineSteps = [
                ['key' => 'scheduled', 'label' => 'Agendada'],
                ['key' => 'checked_in', 'label' => 'Recepcionada'],
                ['key' => 'in_progress', 'label' => 'En lavado'],
                ['key' => 'ready', 'label' => 'Lista'],
                ['key' => 'delivered', 'label' => 'Entregada'],
            ];

            $statusOrder = array_column($timelineSteps, 'key');
            $currentIdx = $active ? array_search($active->status, $statusOrder, true) : false;
            if ($currentIdx === false) {
                $currentIdx = -1;
            }

            $logsByTo = [];
            if ($active) {
                foreach ($active->statusLogs ?? [] as $log) {
                    $logsByTo[(string) $log->to_status] = optional($log->created_at)?->toIso8601String();
                }
            }

            $timeline = array_map(function ($step, $idx) use ($currentIdx, $logsByTo, $active) {
                $done = $currentIdx >= 0 && $idx <= $currentIdx;
                $current = $active && $active->status === $step['key'];

                return [
                    'key' => $step['key'],
                    'label' => $step['label'],
                    'done' => $done,
                    'current' => $current,
                    'at' => $logsByTo[$step['key']] ?? null,
                ];
            }, $timelineSteps, array_keys($timelineSteps));

            $appointmentPayload = null;
            if ($active) {
                $statusStep = collect($timelineSteps)->firstWhere('key', $active->status);
                $appointmentPayload = [
                    'uuid' => $active->uuid,
                    'status' => $active->status,
                    'status_label' => is_array($statusStep) ? ($statusStep['label'] ?? $active->status) : $active->status,
                    'customer_name' => $active->customer_name,
                    'customer_phone' => $active->customer_phone,
                    'vehicle_plates' => $active->vehicle_plates,
                    'vehicle_brand' => $active->vehicle_brand,
                    'vehicle_model' => $active->vehicle_model,
                    'vehicle_color' => $active->vehicle_color,
                    'scheduled_start_at' => optional($active->scheduled_start_at)?->toIso8601String(),
                    'scheduled_local' => optional($active->scheduled_start_at)
                        ?->timezone('America/Mexico_City')
                        ->format('Y-m-d H:i'),
                    'quoted_price' => $active->quoted_price,
                    'location' => $active->location ? [
                        'uuid' => $active->location->uuid,
                        'name' => $active->location->name,
                        'address' => $active->location->address,
                    ] : null,
                    'service_type' => $active->serviceType ? [
                        'uuid' => $active->serviceType->uuid,
                        'name' => $active->serviceType->name,
                        'duration_minutes' => $active->serviceType->duration_minutes,
                        'price' => $active->serviceType->price,
                    ] : null,
                ];
            }

            return ApiResponseHelper::apiSuccess(200, 'Estatus CarWash cliente', [
                'phone' => $phone !== '' ? $phone : '+52'.$last10,
                'appointment' => $appointmentPayload,
                'timeline' => $timeline,
                'loyalty' => [
                    'ok' => (bool) ($loyalty['ok'] ?? false),
                    'enabled' => (bool) ($loyalty['enabled'] ?? true),
                    'stamps_count' => (int) ($loyalty['stamps_count'] ?? 0),
                    'slots' => (int) ($loyalty['slots'] ?? 10),
                    'remaining' => (int) ($loyalty['remaining'] ?? 10),
                    'completed_cycles' => (int) ($loyalty['completed_cycles'] ?? 0),
                    'reward_text' => (string) ($loyalty['reward_text'] ?? ''),
                    'punch_card' => (string) ($loyalty['punch_card'] ?? ''),
                    'punch_card_lines' => $loyalty['punch_card_lines'] ?? [],
                    'message' => (string) ($loyalty['message'] ?? ''),
                ],
                'history' => $appointments->map(fn (CarWashAppointment $a) => [
                    'uuid' => $a->uuid,
                    'status' => $a->status,
                    'scheduled_start_at' => optional($a->scheduled_start_at)?->toIso8601String(),
                    'service' => $a->serviceType?->name,
                    'plates' => $a->vehicle_plates,
                ])->values()->all(),
            ]);
        } catch (\Throwable $e) {
            return ApiResponseHelper::apiError('Error al consultar estatus CarWash', $e->getMessage(), 500, 'CARWASH_PUBLIC_STATUS');
        }
    }
}
