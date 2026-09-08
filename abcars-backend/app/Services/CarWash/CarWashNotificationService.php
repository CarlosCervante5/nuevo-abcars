<?php

namespace App\Services\CarWash;

use App\Models\CarWash\CarWashAppointment;
use App\Models\CarWash\CarWashNotificationOutbox;
use App\Jobs\SendCarWashWhatsAppNotification;

class CarWashNotificationService
{
    /** Estatus que generan aviso WhatsApp (MVP). */
    public const NOTIFY_STATUSES = ['checked_in', 'in_progress', 'ready', 'delivered'];

    public function queueStatusNotification(CarWashAppointment $appointment, string $toStatus): ?CarWashNotificationOutbox
    {
        $toStatus = strtolower(trim($toStatus));
        if (! in_array($toStatus, self::NOTIFY_STATUSES, true)) {
            return null;
        }

        $phone = trim((string) $appointment->customer_phone);
        if ($phone === '') {
            return null;
        }

        $appointment->loadMissing(['location', 'serviceType']);

        $vehicle = trim(implode(' ', array_filter([
            $appointment->vehicle_brand,
            $appointment->vehicle_model,
            $appointment->vehicle_plates ? '('.$appointment->vehicle_plates.')' : null,
        ]))) ?: 'vehículo';

        $locationName = $appointment->location?->name ?? 'ABCars CarWash';
        $name = $appointment->customer_name ?: 'cliente';

        $body = match ($toStatus) {
            'checked_in' => "Hola {$name}, recibimos tu {$vehicle} en {$locationName}. Pronto iniciaremos el lavado.",
            'in_progress' => "Hola {$name}, tu {$vehicle} ya está en lavado en {$locationName}.",
            'ready' => "Hola {$name}, ¡tu {$vehicle} ya está listo para recoger en {$locationName}!",
            'delivered' => "Hola {$name}, gracias por visitarnos en {$locationName}. ¡Hasta pronto!",
            default => null,
        };

        if (! $body) {
            return null;
        }

        $outbox = CarWashNotificationOutbox::create([
            'appointment_id' => $appointment->id,
            'channel' => 'whatsapp',
            'to_phone' => $phone,
            'template_key' => 'status_'.$toStatus,
            'body' => $body,
            'status' => 'pending',
            'attempts' => 0,
            'meta' => [
                'appointment_uuid' => $appointment->uuid,
                'to_status' => $toStatus,
            ],
        ]);

        SendCarWashWhatsAppNotification::dispatchSync($outbox->id);

        return $outbox->fresh();
    }
}
