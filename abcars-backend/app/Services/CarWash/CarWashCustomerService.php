<?php

namespace App\Services\CarWash;

use App\Models\CarWash\CarWashAppointment;
use App\Models\CarWash\CarWashCustomer;
use App\Models\CarWash\CarWashNotificationOutbox;
use App\Jobs\SendCarWashWhatsAppNotification;
use App\Services\CarWash\WhatsApp\CarWashPhoneNormalizer;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class CarWashCustomerService
{
    public function tablesReady(): bool
    {
        try {
            return Schema::hasTable((new CarWashCustomer)->getTable());
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Guarda/actualiza el cliente al terminar (delivered) para reofertar el mismo servicio.
     */
    public function rememberFromDelivered(CarWashAppointment $appointment): ?CarWashCustomer
    {
        if (! $this->tablesReady()) {
            return null;
        }

        if (($appointment->order_type ?? 'public') === 'internal_sales_delivery') {
            return null;
        }

        $phone = CarWashPhoneNormalizer::e164((string) $appointment->customer_phone);
        if ($phone === '') {
            return null;
        }

        $appointment->loadMissing(['serviceType', 'location']);

        $customer = CarWashCustomer::query()->firstOrNew(['customer_phone' => $phone]);
        $isNew = ! $customer->exists;
        $customer->customer_name = $appointment->customer_name ?: $customer->customer_name;
        $customer->last_service_type_id = $appointment->service_type_id;
        $customer->last_service_name = $appointment->serviceType?->name;
        $customer->last_service_code = $appointment->serviceType?->code;
        $customer->last_location_id = $appointment->location_id;
        $customer->last_location_name = $appointment->location?->name;
        $customer->last_vehicle_plates = $appointment->vehicle_plates;
        $customer->last_vehicle_brand = $appointment->vehicle_brand;
        $customer->last_vehicle_model = $appointment->vehicle_model;
        $customer->last_appointment_id = $appointment->id;
        $customer->last_delivered_at = $appointment->delivered_at ?? now();
        $customer->visits_count = $isNew ? 1 : ((int) $customer->visits_count + 1);
        $customer->save();

        Log::info('CarWash customer remembered after delivery', [
            'phone' => $phone,
            'service' => $customer->last_service_name,
            'visits' => $customer->visits_count,
        ]);

        return $customer->fresh();
    }

    public function findByPhone(?string $phone): ?CarWashCustomer
    {
        if (! $this->tablesReady()) {
            return null;
        }
        $normalized = CarWashPhoneNormalizer::e164((string) $phone);
        if ($normalized === '') {
            return null;
        }

        return CarWashCustomer::query()->where('customer_phone', $normalized)->first();
    }

    /**
     * Backfill desde citas delivered existentes.
     *
     * @return array{saved: int}
     */
    public function syncFromDeliveredAppointments(int $limit = 200): array
    {
        if (! $this->tablesReady()) {
            return ['saved' => 0];
        }

        $rows = CarWashAppointment::query()
            ->with(['serviceType', 'location'])
            ->where('status', 'delivered')
            ->where(function ($q) {
                $q->whereNull('order_type')->orWhere('order_type', '!=', 'internal_sales_delivery');
            })
            ->orderByDesc('delivered_at')
            ->limit($limit)
            ->get();

        $saved = 0;
        $seen = [];
        foreach ($rows as $appointment) {
            $phone = CarWashPhoneNormalizer::e164((string) $appointment->customer_phone);
            if ($phone === '' || isset($seen[$phone])) {
                continue;
            }
            // Solo la más reciente por teléfono (ya ordenado desc)
            $seen[$phone] = true;
            // visits_count: contar entregas del teléfono
            $visits = CarWashAppointment::query()
                ->where('status', 'delivered')
                ->where(function ($q) use ($phone) {
                    $q->where('customer_phone', $phone)
                        ->orWhere('customer_phone', 'like', '%'.substr(preg_replace('/\D+/', '', $phone) ?? '', -10));
                })
                ->count();

            $customer = $this->rememberFromDelivered($appointment);
            if ($customer) {
                $customer->visits_count = max(1, $visits);
                $customer->save();
                $saved++;
            }
        }

        return ['saved' => $saved];
    }

    public function buildRebookOfferMessage(CarWashCustomer $customer): string
    {
        $name = $customer->customer_name ?: 'cliente';
        $service = $customer->last_service_name ?: 'tu lavado';
        $location = $customer->last_location_name ?: 'ABCars CarWash';
        $plates = $customer->last_vehicle_plates ? " ({$customer->last_vehicle_plates})" : '';

        return implode("\n", [
            "Hola {$name} 👋",
            '',
            "¿Ya es hora de otro *{$service}*{$plates}?",
            "Te atendemos en *{$location}*.",
            '',
            'Responde *agendar* y te armamos la cita rápido (mismo servicio).',
            'O escribe *0* / *iniciar* si quieres empezar de cero.',
        ]);
    }

    /**
     * Envia oferta de rebook a clientes con visita terminada.
     *
     * @return array{sent: int, skipped: int, errors: list<string>, recipients: list<array<string, mixed>>}
     */
    public function sendRebookOffers(array $options = []): array
    {
        if (! $this->tablesReady()) {
            return ['sent' => 0, 'skipped' => 0, 'errors' => ['Tabla carwash_customers no existe'], 'recipients' => []];
        }

        $hoursSinceDelivered = (int) ($options['min_hours_since_delivered'] ?? 0);
        $cooldownHours = (int) ($options['cooldown_hours'] ?? 24);
        $limit = max(1, min(100, (int) ($options['limit'] ?? 50)));
        $force = (bool) ($options['force'] ?? false);
        $onlyPhones = $options['phones'] ?? null;

        $query = CarWashCustomer::query()
            ->whereNotNull('last_delivered_at')
            ->orderByDesc('last_delivered_at');

        if (is_array($onlyPhones) && count($onlyPhones) > 0) {
            $normalized = array_values(array_filter(array_map(
                fn ($p) => CarWashPhoneNormalizer::e164((string) $p),
                $onlyPhones
            )));
            $query->whereIn('customer_phone', $normalized);
        }

        if (! $force && $hoursSinceDelivered > 0) {
            $query->where('last_delivered_at', '<=', now()->subHours($hoursSinceDelivered));
        }

        $customers = $query->limit($limit)->get();
        $sent = 0;
        $skipped = 0;
        $errors = [];
        $recipients = [];

        foreach ($customers as $customer) {
            if (! $force && $customer->last_rebook_offer_at && $customer->last_rebook_offer_at->gt(now()->subHours($cooldownHours))) {
                $skipped++;
                $recipients[] = [
                    'phone' => $customer->customer_phone,
                    'status' => 'skipped_cooldown',
                ];
                continue;
            }

            $body = $this->buildRebookOfferMessage($customer);
            try {
                $outbox = CarWashNotificationOutbox::create([
                    'appointment_id' => $customer->last_appointment_id,
                    'channel' => 'whatsapp',
                    'to_phone' => $customer->customer_phone,
                    'template_key' => 'rebook_offer',
                    'body' => $body,
                    'status' => 'pending',
                    'attempts' => 0,
                    'meta' => [
                        'customer_uuid' => $customer->uuid,
                        'last_service_name' => $customer->last_service_name,
                        'last_service_code' => $customer->last_service_code,
                    ],
                ]);

                SendCarWashWhatsAppNotification::dispatchSync($outbox->id);
                $outbox->refresh();

                if ($outbox->status === 'sent') {
                    $customer->last_rebook_offer_at = now();
                    $customer->rebook_offers_count = (int) $customer->rebook_offers_count + 1;
                    $customer->save();
                    $sent++;
                    $recipients[] = [
                        'phone' => $customer->customer_phone,
                        'name' => $customer->customer_name,
                        'service' => $customer->last_service_name,
                        'status' => 'sent',
                    ];
                } else {
                    $skipped++;
                    $errors[] = ($customer->customer_phone).': '.($outbox->last_error ?: 'send failed');
                    $recipients[] = [
                        'phone' => $customer->customer_phone,
                        'status' => 'failed',
                        'error' => $outbox->last_error,
                    ];
                }
            } catch (\Throwable $e) {
                $skipped++;
                $errors[] = ($customer->customer_phone).': '.$e->getMessage();
            }
        }

        return compact('sent', 'skipped', 'errors', 'recipients');
    }
}
