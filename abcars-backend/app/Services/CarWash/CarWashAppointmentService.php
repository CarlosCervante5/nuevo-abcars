<?php

namespace App\Services\CarWash;

use App\Models\CarWash\CarWashAppointment;
use App\Models\CarWash\CarWashAppointmentStatusLog;
use App\Models\CarWash\CarWashServiceType;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;

class CarWashAppointmentService
{
    public function __construct(
        private CarWashNotificationService $notifications,
        private CarWashLoyaltyService $loyalty,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId = null): CarWashAppointment
    {
        $service = CarWashServiceType::findByUuid((string) $data['service_type_uuid']);
        if (! $service || ! $service->is_active) {
            throw new Exception('Tipo de servicio no válido');
        }

        $location = \App\Models\CarWash\CarWashLocation::findByUuid((string) $data['location_uuid']);
        if (! $location || ! $location->is_active) {
            throw new Exception('Sede CarWash no válida');
        }

        $tz = 'America/Mexico_City';
        $configuredTz = (string) config('app.timezone', '');
        if ($configuredTz !== '' && $configuredTz !== 'UTC') {
            $tz = $configuredTz;
        }

        // Interpretar hora de negocio en México y persistir en timezone de la app.
        $start = Carbon::parse($data['scheduled_start_at'], $tz)->timezone(config('app.timezone', 'UTC'));
        $end = isset($data['scheduled_end_at'])
            ? Carbon::parse($data['scheduled_end_at'], $tz)->timezone(config('app.timezone', 'UTC'))
            : $start->copy()->addMinutes((int) $service->duration_minutes);

        $bayId = null;
        if (! empty($data['bay_uuid'])) {
            $bay = \App\Models\CarWash\CarWashBay::findByUuid((string) $data['bay_uuid']);
            $bayId = $bay?->id;
        }

        $washerId = null;
        if (! empty($data['washer_uuid'])) {
            $washer = \App\Models\CarWash\CarWashWasher::findByUuid((string) $data['washer_uuid']);
            $washerId = $washer?->id;
        }

        return DB::transaction(function () use ($data, $service, $location, $start, $end, $bayId, $washerId, $userId) {
            $orderType = strtolower(trim((string) ($data['order_type'] ?? 'public')));
            if (! in_array($orderType, CarWashAppointment::ORDER_TYPES, true)) {
                $orderType = 'public';
            }

            $vin = isset($data['vehicle_vin']) ? strtoupper(preg_replace('/\s+/', '', (string) $data['vehicle_vin']) ?? '') : null;
            $vin = $vin !== '' ? $vin : null;
            $condition = isset($data['vehicle_condition']) ? strtolower(trim((string) $data['vehicle_condition'])) : null;
            if ($condition && ! in_array($condition, CarWashAppointment::VEHICLE_CONDITIONS, true)) {
                throw new Exception('Condición de vehículo no válida (new|used)');
            }

            if ($orderType === 'internal_sales_delivery') {
                if (! $vin || strlen($vin) < 11) {
                    throw new Exception('Para entregas Ventas el VIN es obligatorio (mín. 11 caracteres)');
                }
                if (! $condition) {
                    throw new Exception('Indica si el auto es nuevo o seminuevo');
                }
                if (empty($data['vehicle_brand']) || empty($data['vehicle_model'])) {
                    throw new Exception('Marca y modelo son obligatorios en entregas Ventas');
                }
            }

            $appointment = CarWashAppointment::create([
                'location_id' => $location->id,
                'service_type_id' => $service->id,
                'bay_id' => $bayId,
                'washer_id' => $washerId,
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'vehicle_plates' => $data['vehicle_plates'] ?? null,
                'vehicle_brand' => $data['vehicle_brand'] ?? null,
                'vehicle_model' => $data['vehicle_model'] ?? null,
                'vehicle_color' => $data['vehicle_color'] ?? null,
                'vehicle_vin' => $vin,
                'vehicle_condition' => $condition,
                'vin_validation_status' => $orderType === 'internal_sales_delivery' ? 'pending' : 'skipped',
                'requested_by_name' => $data['requested_by_name'] ?? null,
                'status' => $data['status'] ?? 'scheduled',
                'channel' => $data['channel'] ?? 'admin',
                'order_type' => $orderType,
                'scheduled_start_at' => $start,
                'scheduled_end_at' => $end,
                'notes' => $data['notes'] ?? null,
                'quoted_price' => $data['quoted_price'] ?? $service->price,
                'created_by' => $userId,
            ]);

            $this->logStatus($appointment, null, $appointment->status, $userId, 'create');

            return $appointment->fresh(['location', 'serviceType', 'bay', 'washer']);
        });
    }

    /**
     * Valida VIN contra inventario (vehicles) si existe.
     */
    public function validateVin(CarWashAppointment $appointment): CarWashAppointment
    {
        $vin = strtoupper(preg_replace('/\s+/', '', (string) $appointment->vehicle_vin) ?? '');
        if ($vin === '') {
            throw new Exception('La cita no tiene VIN para validar');
        }

        $matched = false;
        if (class_exists(\App\Models\Vehicle::class)) {
            $matched = \App\Models\Vehicle::query()
                ->whereRaw('UPPER(REPLACE(vin, " ", "")) = ?', [$vin])
                ->exists();
        }

        $appointment->vin_validation_status = $matched ? 'matched' : 'unmatched';
        $appointment->vin_validated_at = now();
        $appointment->save();

        return $appointment->fresh(['location', 'serviceType', 'bay', 'washer']);
    }

    public function changeStatus(CarWashAppointment $appointment, string $toStatus, ?int $userId = null, string $source = 'admin'): CarWashAppointment
    {
        $toStatus = strtolower(trim($toStatus));
        if (! in_array($toStatus, CarWashAppointment::STATUSES, true)) {
            throw new Exception('Estatus no válido');
        }

        $from = $appointment->status;
        if ($from === $toStatus) {
            return $appointment;
        }

        $appointment->status = $toStatus;
        $now = now();
        match ($toStatus) {
            'checked_in' => $appointment->checked_in_at = $appointment->checked_in_at ?? $now,
            'in_progress' => $appointment->started_at = $appointment->started_at ?? $now,
            'ready' => $appointment->ready_at = $appointment->ready_at ?? $now,
            'delivered' => $appointment->delivered_at = $appointment->delivered_at ?? $now,
            'cancelled', 'no_show' => $appointment->cancelled_at = $appointment->cancelled_at ?? $now,
            default => null,
        };
        $appointment->save();

        $this->logStatus($appointment, $from, $toStatus, $userId, $source);
        $this->notifications->queueStatusNotification($appointment, $toStatus);

        if ($toStatus === 'delivered') {
            $fresh = $appointment->fresh() ?? $appointment;
            if (! $fresh->isInternalSalesDelivery()) {
                $award = $this->loyalty->awardOnDelivered($fresh);
                $this->notifications->queueLoyaltyStampCard($fresh, $award);
            }
        }

        return $appointment->fresh(['location', 'serviceType', 'bay', 'washer']);
    }

    private function logStatus(
        CarWashAppointment $appointment,
        ?string $from,
        string $to,
        ?int $userId,
        string $source,
        array $meta = [],
    ): void {
        CarWashAppointmentStatusLog::create([
            'appointment_id' => $appointment->id,
            'from_status' => $from,
            'to_status' => $to,
            'user_id' => $userId,
            'source' => $source,
            'meta' => $meta ?: null,
        ]);
    }
}
