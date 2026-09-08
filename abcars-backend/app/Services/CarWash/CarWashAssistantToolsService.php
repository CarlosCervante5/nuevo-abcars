<?php

namespace App\Services\CarWash;

use App\Models\CarWash\CarWashAppointment;
use App\Models\CarWash\CarWashLocation;
use App\Models\CarWash\CarWashServiceType;
use App\Models\CarWash\CarWashWhatsAppConversation;
use Carbon\Carbon;
use Exception;

class CarWashAssistantToolsService
{
    public function __construct(private CarWashAppointmentService $appointments) {}

    public function execute(string $toolName, array $arguments, ?string $callerPhone = null): array
    {
        return match ($toolName) {
            'carwash_list_services' => $this->listServices(),
            'carwash_list_locations' => $this->listLocations(),
            'carwash_get_availability' => $this->getAvailability($arguments),
            'carwash_create_appointment' => $this->createAppointment($arguments, $callerPhone),
            'carwash_cancel_appointment' => $this->cancelAppointment($arguments, $callerPhone),
            'carwash_get_appointment_status' => $this->getAppointmentStatus($arguments, $callerPhone),
            'carwash_handoff_to_human' => $this->handoff($arguments, $callerPhone),
            default => ['error' => "Herramienta desconocida: {$toolName}"],
        };
    }

    public function getToolsDefinitions(): array
    {
        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'carwash_list_services',
                    'description' => 'Lista los paquetes de lavado activos con duración y precio.',
                    'parameters' => ['type' => 'object', 'properties' => (object) [], 'required' => []],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'carwash_list_locations',
                    'description' => 'Lista sedes CarWash activas.',
                    'parameters' => ['type' => 'object', 'properties' => (object) [], 'required' => []],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'carwash_get_availability',
                    'description' => 'Resumen de ocupación para una sede y fecha (citas ya agendadas).',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'location_uuid' => ['type' => 'string', 'description' => 'UUID de la sede.'],
                            'date' => ['type' => 'string', 'description' => 'Fecha YYYY-MM-DD.'],
                        ],
                        'required' => ['location_uuid', 'date'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'carwash_create_appointment',
                    'description' => 'Crea una cita de lavado. Confirma datos con el cliente antes de llamar.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'location_uuid' => ['type' => 'string'],
                            'service_code' => ['type' => 'string', 'description' => 'Código: express, completo, detailing, moto'],
                            'service_type_uuid' => ['type' => 'string'],
                            'customer_name' => ['type' => 'string'],
                            'customer_phone' => ['type' => 'string', 'description' => 'Teléfono E.164 o 10 dígitos MX'],
                            'scheduled_start_at' => ['type' => 'string', 'description' => 'ISO8601 o YYYY-MM-DD HH:MM'],
                            'vehicle_plates' => ['type' => 'string'],
                            'vehicle_brand' => ['type' => 'string'],
                            'vehicle_model' => ['type' => 'string'],
                            'vehicle_color' => ['type' => 'string'],
                            'notes' => ['type' => 'string'],
                        ],
                        'required' => ['location_uuid', 'customer_name', 'scheduled_start_at'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'carwash_get_appointment_status',
                    'description' => 'Consulta estatus de citas por teléfono o UUID.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'appointment_uuid' => ['type' => 'string'],
                            'phone' => ['type' => 'string'],
                            'plates' => ['type' => 'string'],
                        ],
                        'required' => [],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'carwash_cancel_appointment',
                    'description' => 'Cancela una cita por UUID (debe pertenecer al teléfono del cliente).',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'appointment_uuid' => ['type' => 'string'],
                            'phone' => ['type' => 'string'],
                        ],
                        'required' => ['appointment_uuid'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'carwash_handoff_to_human',
                    'description' => 'Marca la conversación para atención humana.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'reason' => ['type' => 'string'],
                            'phone' => ['type' => 'string'],
                        ],
                        'required' => [],
                    ],
                ],
            ],
        ];
    }

    private function listServices(): array
    {
        $items = CarWashServiceType::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['uuid', 'name', 'code', 'duration_minutes', 'price', 'description']);

        return ['services' => $items];
    }

    private function listLocations(): array
    {
        $items = CarWashLocation::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['uuid', 'name', 'code', 'phone', 'address']);

        return ['locations' => $items];
    }

    private function getAvailability(array $args): array
    {
        $location = CarWashLocation::findByUuid((string) ($args['location_uuid'] ?? ''));
        if (! $location) {
            return ['error' => 'Sede no encontrada'];
        }

        try {
            $day = Carbon::parse((string) ($args['date'] ?? now()->toDateString()));
        } catch (\Throwable) {
            return ['error' => 'Fecha inválida'];
        }

        $appointments = CarWashAppointment::query()
            ->where('location_id', $location->id)
            ->whereBetween('scheduled_start_at', [$day->copy()->startOfDay(), $day->copy()->endOfDay()])
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->orderBy('scheduled_start_at')
            ->get(['uuid', 'customer_name', 'status', 'scheduled_start_at', 'scheduled_end_at']);

        return [
            'location' => $location->only(['uuid', 'name']),
            'date' => $day->toDateString(),
            'booked_count' => $appointments->count(),
            'slots' => $appointments->map(fn ($a) => [
                'uuid' => $a->uuid,
                'status' => $a->status,
                'start' => optional($a->scheduled_start_at)->toIso8601String(),
                'end' => optional($a->scheduled_end_at)->toIso8601String(),
            ]),
            'hint' => 'Sugiere horarios libres evitando los slots listados. Horario típico 09:00–18:00.',
        ];
    }

    private function createAppointment(array $args, ?string $callerPhone): array
    {
        try {
            $serviceUuid = $args['service_type_uuid'] ?? null;
            if (! $serviceUuid && ! empty($args['service_code'])) {
                $service = CarWashServiceType::query()->where('code', $args['service_code'])->first();
                $serviceUuid = $service?->uuid;
            }
            if (! $serviceUuid) {
                return ['error' => 'Indica service_code o service_type_uuid'];
            }

            $phone = (string) ($args['customer_phone'] ?? $callerPhone ?? '');
            if ($phone === '') {
                return ['error' => 'Falta teléfono del cliente'];
            }

            $appointment = $this->appointments->create([
                'location_uuid' => $args['location_uuid'],
                'service_type_uuid' => $serviceUuid,
                'customer_name' => $args['customer_name'],
                'customer_phone' => $phone,
                'scheduled_start_at' => $args['scheduled_start_at'],
                'vehicle_plates' => $args['vehicle_plates'] ?? null,
                'vehicle_brand' => $args['vehicle_brand'] ?? null,
                'vehicle_model' => $args['vehicle_model'] ?? null,
                'vehicle_color' => $args['vehicle_color'] ?? null,
                'notes' => $args['notes'] ?? null,
                'channel' => 'whatsapp',
                'status' => 'scheduled',
            ], null);

            return [
                'ok' => true,
                'appointment' => [
                    'uuid' => $appointment->uuid,
                    'status' => $appointment->status,
                    'scheduled_start_at' => optional($appointment->scheduled_start_at)->toIso8601String(),
                    'service' => $appointment->serviceType?->name,
                    'location' => $appointment->location?->name,
                    'quoted_price' => $appointment->quoted_price,
                ],
            ];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }

    private function getAppointmentStatus(array $args, ?string $callerPhone): array
    {
        $query = CarWashAppointment::query()->with(['location', 'serviceType'])->orderByDesc('scheduled_start_at');

        if (! empty($args['appointment_uuid'])) {
            $query->where('uuid', $args['appointment_uuid']);
        } else {
            $phone = (string) ($args['phone'] ?? $callerPhone ?? '');
            $digits = preg_replace('/\D+/', '', $phone) ?? '';
            if ($digits === '' && empty($args['plates'])) {
                return ['error' => 'Indica teléfono, placas o UUID de cita'];
            }
            if ($digits !== '') {
                $query->where(function ($q) use ($digits) {
                    $q->where('customer_phone', 'like', '%'.$digits.'%')
                        ->orWhere('customer_phone', 'like', '%'.substr($digits, -10).'%');
                });
            }
            if (! empty($args['plates'])) {
                $query->where('vehicle_plates', 'like', '%'.$args['plates'].'%');
            }
        }

        $items = $query->limit(5)->get()->map(fn ($a) => [
            'uuid' => $a->uuid,
            'status' => $a->status,
            'customer_name' => $a->customer_name,
            'vehicle_plates' => $a->vehicle_plates,
            'scheduled_start_at' => optional($a->scheduled_start_at)->toIso8601String(),
            'service' => $a->serviceType?->name,
            'location' => $a->location?->name,
        ]);

        return ['appointments' => $items, 'count' => $items->count()];
    }

    private function cancelAppointment(array $args, ?string $callerPhone): array
    {
        $appointment = CarWashAppointment::findByUuid((string) ($args['appointment_uuid'] ?? ''));
        if (! $appointment) {
            return ['error' => 'Cita no encontrada'];
        }

        $phone = (string) ($args['phone'] ?? $callerPhone ?? '');
        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        $apptDigits = preg_replace('/\D+/', '', (string) $appointment->customer_phone) ?? '';
        if ($digits !== '' && $apptDigits !== '' && ! str_ends_with($apptDigits, substr($digits, -10))) {
            return ['error' => 'La cita no pertenece a este teléfono'];
        }

        try {
            $updated = $this->appointments->changeStatus($appointment, 'cancelled', null, 'whatsapp');

            return ['ok' => true, 'uuid' => $updated->uuid, 'status' => $updated->status];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }

    private function handoff(array $args, ?string $callerPhone): array
    {
        $phone = (string) ($args['phone'] ?? $callerPhone ?? '');
        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        if ($digits === '') {
            return ['error' => 'Sin teléfono para handoff'];
        }

        $e164 = '+'.$digits;
        $conversation = CarWashWhatsAppConversation::query()
            ->where(function ($q) use ($e164, $digits) {
                $q->where('phone', $e164)
                    ->orWhere('phone', 'like', '%'.substr($digits, -10));
            })
            ->first();

        if ($conversation) {
            $conversation->needs_human = true;
            $meta = $conversation->meta ?? [];
            $meta['handoff_reason'] = $args['reason'] ?? 'cliente solicitó asesor';
            $meta['handoff_at'] = now()->toIso8601String();
            $conversation->meta = $meta;
            $conversation->save();
        }

        return [
            'ok' => true,
            'message' => 'Conversación marcada para atención humana.',
        ];
    }
}
