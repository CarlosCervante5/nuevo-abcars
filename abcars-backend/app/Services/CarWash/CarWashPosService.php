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
    public const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'mixed'];

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

        return DB::transaction(function () use ($data, $location, $paymentMethod, $itemsInput, $appointment, $cashierUserId) {
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

            $order = CarWashOrder::create([
                'location_id' => $location->id,
                'appointment_id' => $appointment?->id,
                'cashier_user_id' => $cashierUserId,
                'status' => 'paid',
                'customer_name' => $data['customer_name'] ?? $appointment?->customer_name,
                'customer_phone' => $data['customer_phone'] ?? $appointment?->customer_phone,
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
                    $product->stock = (int) $product->stock - (int) $line['quantity'];
                    $product->save();
                    unset($line['_product']);
                }

                CarWashOrderItem::create(array_merge($line, [
                    'order_id' => $order->id,
                ]));
            }

            return $order->fresh(['items', 'location', 'appointment.serviceType']);
        });
    }
}
