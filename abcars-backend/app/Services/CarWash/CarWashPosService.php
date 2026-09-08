<?php

namespace App\Services\CarWash;

use App\Models\CarWash\CarWashAppointment;
use App\Models\CarWash\CarWashLocation;
use App\Models\CarWash\CarWashOrder;
use App\Models\CarWash\CarWashOrderItem;
use App\Models\CarWash\CarWashProduct;
use App\Models\CarWash\CarWashServiceType;
use Exception;
use Illuminate\Support\Facades\DB;

class CarWashPosService
{
    public const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'mixed', 'internal'];

    /**
     * Cobro único (MVP): crea orden pagada con ítems de servicio y/o producto.
     *
     * @param  array<string, mixed>  $data
     */
    public function checkout(array $data, ?int $cashierUserId = null): CarWashOrder
    {
        $location = CarWashLocation::findByUuid((string) $data['location_uuid']);
        if (! $location || ! $location->is_active) {
            throw new Exception('Sede CarWash no válida');
        }

        $paymentMethod = strtolower((string) ($data['payment_method'] ?? 'cash'));
        if (! in_array($paymentMethod, self::PAYMENT_METHODS, true)) {
            throw new Exception('Método de pago no válido');
        }

        $orderType = strtolower(trim((string) ($data['order_type'] ?? 'public')));
        if (! in_array($orderType, CarWashAppointment::ORDER_TYPES, true)) {
            $orderType = 'public';
        }

        $vin = isset($data['vehicle_vin']) ? strtoupper(preg_replace('/\s+/', '', (string) $data['vehicle_vin']) ?? '') : '';
        $vin = $vin !== '' ? $vin : null;
        $condition = isset($data['vehicle_condition']) ? strtolower(trim((string) $data['vehicle_condition'])) : null;
        if ($condition && ! in_array($condition, CarWashAppointment::VEHICLE_CONDITIONS, true)) {
            throw new Exception('Condición de vehículo no válida (new|used)');
        }

        if ($orderType === 'internal_sales_delivery') {
            if (! $vin || strlen($vin) < 11) {
                throw new Exception('Entrega Ventas requiere VIN válido');
            }
            if (! $condition) {
                throw new Exception('Indica si el auto es nuevo o seminuevo');
            }
            $paymentMethod = 'internal';
        }

        $itemsInput = $data['items'] ?? [];
        if (! is_array($itemsInput) || count($itemsInput) === 0) {
            throw new Exception('Agrega al menos un ítem al ticket');
        }

        $appointment = null;
        if (! empty($data['appointment_uuid'])) {
            $appointment = CarWashAppointment::findByUuid((string) $data['appointment_uuid']);
            if (! $appointment) {
                throw new Exception('Cita no encontrada');
            }
            if ((int) $appointment->location_id !== (int) $location->id) {
                throw new Exception('La cita no pertenece a la sede seleccionada');
            }
        }

        return DB::transaction(function () use ($data, $location, $paymentMethod, $itemsInput, $appointment, $cashierUserId, $orderType, $vin, $condition) {
            if ($orderType === 'internal_sales_delivery' && ! $appointment) {
                $serviceUuid = null;
                foreach ($itemsInput as $row) {
                    if (strtolower((string) ($row['item_type'] ?? '')) === 'service') {
                        $serviceUuid = (string) ($row['uuid'] ?? '');
                        break;
                    }
                }
                if (! $serviceUuid) {
                    throw new Exception('Agrega un servicio de lavado para la entrega Ventas');
                }

                $appointmentService = app(CarWashAppointmentService::class);
                $start = $data['scheduled_start_at'] ?? now('America/Mexico_City')->addHour()->format('Y-m-d H:i');
                $appointment = $appointmentService->create([
                    'location_uuid' => $location->uuid,
                    'service_type_uuid' => $serviceUuid,
                    'customer_name' => $data['customer_name'] ?: ('Entrega Ventas '.($vin ?? '')),
                    'customer_phone' => $data['customer_phone'] ?: '0000000000',
                    'vehicle_plates' => $data['vehicle_plates'] ?? null,
                    'vehicle_brand' => $data['vehicle_brand'] ?? null,
                    'vehicle_model' => $data['vehicle_model'] ?? null,
                    'vehicle_color' => $data['vehicle_color'] ?? null,
                    'vehicle_vin' => $vin,
                    'vehicle_condition' => $condition,
                    'order_type' => 'internal_sales_delivery',
                    'requested_by_name' => $data['requested_by_name'] ?? null,
                    'scheduled_start_at' => $start,
                    'notes' => $data['notes'] ?? null,
                    'channel' => 'admin',
                ], $cashierUserId);
            }

            $resolved = [];
            $subtotal = 0.0;

            foreach ($itemsInput as $row) {
                $type = strtolower((string) ($row['item_type'] ?? ''));
                $uuid = (string) ($row['uuid'] ?? '');
                $qty = max(1, (int) ($row['quantity'] ?? 1));

                if ($type === 'service') {
                    $service = CarWashServiceType::findByUuid($uuid);
                    if (! $service || ! $service->is_active) {
                        throw new Exception('Servicio no válido en el ticket');
                    }
                    $unit = (float) $service->price;
                    $line = round($unit * $qty, 2);
                    $resolved[] = [
                        'item_type' => 'service',
                        'item_id' => $service->id,
                        'name' => $service->name,
                        'quantity' => $qty,
                        'unit_price' => $unit,
                        'line_total' => $line,
                    ];
                    $subtotal += $line;
                } elseif ($type === 'product') {
                    $product = CarWashProduct::query()->where('uuid', $uuid)->lockForUpdate()->first();
                    if (! $product || ! $product->is_active) {
                        throw new Exception('Producto no válido en el ticket');
                    }
                    if ((int) $product->stock < $qty) {
                        throw new Exception("Stock insuficiente para {$product->name}");
                    }
                    $unit = (float) $product->price;
                    $line = round($unit * $qty, 2);
                    $resolved[] = [
                        'item_type' => 'product',
                        'item_id' => $product->id,
                        'name' => $product->name,
                        'quantity' => $qty,
                        'unit_price' => $unit,
                        'line_total' => $line,
                        '_product' => $product,
                    ];
                    $subtotal += $line;
                } else {
                    throw new Exception('Tipo de ítem no válido (service|product)');
                }
            }

            $subtotal = round($subtotal, 2);
            if ($orderType === 'internal_sales_delivery') {
                $subtotal = 0.0;
            }

            $order = CarWashOrder::create([
                'location_id' => $location->id,
                'appointment_id' => $appointment?->id,
                'cashier_user_id' => $cashierUserId,
                'status' => 'paid',
                'order_type' => $orderType,
                'customer_name' => $data['customer_name'] ?? $appointment?->customer_name,
                'customer_phone' => $data['customer_phone'] ?? $appointment?->customer_phone,
                'vehicle_vin' => $vin ?? $appointment?->vehicle_vin,
                'vehicle_condition' => $condition ?? $appointment?->vehicle_condition,
                'subtotal' => $subtotal,
                'total' => $subtotal,
                'payment_method' => $paymentMethod,
                'paid_at' => now(),
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($resolved as $line) {
                if (($line['item_type'] ?? '') === 'product' && isset($line['_product'])) {
                    /** @var CarWashProduct $product */
                    $product = $line['_product'];
                    $product->stock = max(0, (int) $product->stock - (int) $line['quantity']);
                    $product->save();
                    unset($line['_product']);
                }

                CarWashOrderItem::create([
                    'order_id' => $order->id,
                    'item_type' => $line['item_type'],
                    'item_id' => $line['item_id'],
                    'name' => $line['name'],
                    'quantity' => $line['quantity'],
                    'unit_price' => $orderType === 'internal_sales_delivery' ? 0 : $line['unit_price'],
                    'line_total' => $orderType === 'internal_sales_delivery' ? 0 : $line['line_total'],
                ]);
            }

            return $order->fresh(['items', 'location', 'appointment.serviceType']);
        });
    }
}
