<?php

namespace App\Services\CarWash;

use App\Models\CarWash\CarWashAppointment;
use App\Models\CarWash\CarWashLocation;
use App\Models\CarWash\CarWashServiceType;
use App\Models\CarWash\CarWashWhatsAppConversation;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CarWashAssistantToolsService
{
    public function __construct(
        private CarWashAppointmentService $appointments,
        private CarWashLoyaltyService $loyalty,
    ) {}

    public function execute(string $toolName, array $arguments, ?string $callerPhone = null): array
    {
        return match ($toolName) {
            'carwash_list_services' => $this->listServices(),
            'carwash_list_locations' => $this->listLocations(),
            'carwash_get_availability' => $this->getAvailability($arguments),
            'carwash_create_appointment' => $this->createAppointment($arguments, $callerPhone),
            'carwash_cancel_appointment' => $this->cancelAppointment($arguments, $callerPhone),
            'carwash_get_appointment_status' => $this->getAppointmentStatus($arguments, $callerPhone),
            'carwash_get_loyalty_stamps' => $this->getLoyaltyStamps($arguments, $callerPhone),
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
                    'description' => 'Obtiene paquetes de lavado (precio/duración) para sugerir conversacionalmente 2–3 opciones. No vuelques toda la lista al cliente salvo que pida ver todos.',
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
                    'description' => 'Devuelve horarios LIBRES y ocupados de una sede para una fecha. Si available_slots tiene valores, SÍ hay disponibilidad. slots/booked vacíos = día libre, no “sin cupo”.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'location_uuid' => ['type' => 'string', 'description' => 'UUID, código o nombre de la sede.'],
                            'date' => ['type' => 'string', 'description' => 'YYYY-MM-DD, o hoy / mañana.'],
                            'duration_minutes' => ['type' => 'integer', 'description' => 'Duración del servicio en minutos (default 60).'],
                        ],
                        'required' => ['location_uuid', 'date'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'carwash_create_appointment',
                    'description' => 'Crea una cita de lavado en la base de datos. Obligatorio llamarla para agendar. No inventes éxito: solo confirma si responde ok:true.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'location_uuid' => ['type' => 'string', 'description' => 'UUID de sede (preferido) o nombre/código de sede.'],
                            'service_code' => ['type' => 'string', 'description' => 'Código EXACTO del catálogo (ej. lavado-pulido-encerado). Obligatorio si no mandas service_type_uuid.'],
                            'service_type_uuid' => ['type' => 'string', 'description' => 'UUID del servicio de carwash_list_services.'],
                            'service_name' => ['type' => 'string', 'description' => 'Nombre del servicio del catálogo (fallback si no tienes code/uuid).'],
                            'customer_name' => ['type' => 'string'],
                            'customer_phone' => ['type' => 'string', 'description' => 'Teléfono E.164 o 10 dígitos MX'],
                            'scheduled_start_at' => ['type' => 'string', 'description' => 'Preferible YYYY-MM-DD HH:MM (America/Mexico_City). También acepta mañana 14:00 / mañana 2 PM. Respeta fechas concretas del cliente (p. ej. 2026-09-14 15:00).'],
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
                    'name' => 'carwash_get_loyalty_stamps',
                    'description' => 'Consulta la cuponera virtual (sellos de lealtad) del cliente. Úsala si preguntan por sellos, cuponera, puntos o recompensa.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'phone' => ['type' => 'string', 'description' => 'Teléfono opcional; por defecto el del chat.'],
                        ],
                        'required' => [],
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

        $suggestions = [];
        foreach ($items->take(3) as $s) {
            $price = is_numeric($s->price) ? '$'.number_format((float) $s->price, 0) : (string) $s->price;
            $mins = (int) ($s->duration_minutes ?? 0);
            $suggestions[] = [
                'code' => $s->code,
                'name' => $s->name,
                'pitch' => "{$s->name} ({$price}, ~{$mins} min)",
            ];
        }

        return [
            'ok' => true,
            'services' => $items,
            'top_suggestions' => $suggestions,
            'assistant_instruction' => 'Ofrece top_suggestions en tono conversacional (2–3). Pregunta qué busca (rápido / completo / brillo). Al crear cita usa SIEMPRE el code exacto de services[].code (nunca inventes “lavado básico” ni códigos). En el resumen de confirmación usa el name oficial del catálogo. No pegues la lista completa salvo que el cliente pida ver todos.',
        ];
    }

    private function listLocations(): array
    {
        $items = CarWashLocation::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['uuid', 'name', 'code', 'phone', 'address']);

        $names = $items->pluck('name')->filter()->values()->all();

        return [
            'ok' => true,
            'locations' => $items,
            'assistant_instruction' => count($names) <= 2
                ? 'Menciona las sedes en una frase y pregunta cuál le queda mejor.'
                : 'Pregunta por zona o ofrece primero la sede principal; no sueltes un menú largo.',
        ];
    }

    private function getAvailability(array $args): array
    {
        $location = $this->resolveLocation(
            isset($args['location_uuid']) ? (string) $args['location_uuid'] : null,
            isset($args['location_name']) ? (string) $args['location_name'] : null,
        );
        if (! $location) {
            return ['ok' => false, 'error' => 'Sede no encontrada'];
        }

        try {
            $day = $this->parseAvailabilityDate((string) ($args['date'] ?? 'hoy'));
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => 'Fecha inválida: '.$e->getMessage()];
        }

        $tz = 'America/Mexico_City';
        $configuredTz = (string) config('app.timezone', '');
        if ($configuredTz !== '' && $configuredTz !== 'UTC') {
            $tz = $configuredTz;
        }

        $dayStart = $day->copy()->timezone($tz)->startOfDay();
        $dayEnd = $day->copy()->timezone($tz)->endOfDay();
        $duration = max(15, (int) ($args['duration_minutes'] ?? 60));
        $openHour = 9;
        $closeHour = 18;
        $stepMinutes = 60;

        $appointments = CarWashAppointment::query()
            ->where('location_id', $location->id)
            ->whereBetween('scheduled_start_at', [$dayStart, $dayEnd])
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->orderBy('scheduled_start_at')
            ->get(['uuid', 'customer_name', 'status', 'scheduled_start_at', 'scheduled_end_at']);

        $booked = $appointments->map(function ($a) use ($tz) {
            $start = optional($a->scheduled_start_at)?->timezone($tz);
            $end = optional($a->scheduled_end_at)?->timezone($tz);

            return [
                'uuid' => $a->uuid,
                'status' => $a->status,
                'start' => $start?->toIso8601String(),
                'end' => $end?->toIso8601String(),
                'time' => $start?->format('H:i'),
            ];
        })->values()->all();

        $now = now($tz);
        $available = [];
        $cursor = $dayStart->copy()->setTime($openHour, 0, 0);
        $lastStart = $dayStart->copy()->setTime($closeHour, 0, 0)->subMinutes($duration);

        while ($cursor->lte($lastStart)) {
            $slotStart = $cursor->copy();
            $slotEnd = $cursor->copy()->addMinutes($duration);

            $isPast = $dayStart->isSameDay($now) && $slotEnd->lte($now);
            $overlaps = $appointments->contains(function ($a) use ($slotStart, $slotEnd) {
                $aStart = $a->scheduled_start_at;
                $aEnd = $a->scheduled_end_at ?? optional($a->scheduled_start_at)?->copy()->addHour();
                if (! $aStart || ! $aEnd) {
                    return false;
                }

                return $slotStart->lt($aEnd) && $slotEnd->gt($aStart);
            });

            if (! $isPast && ! $overlaps) {
                $available[] = $slotStart->format('H:i');
            }

            $cursor->addMinutes($stepMinutes);
        }

        $message = count($available) > 0
            ? 'Hay horarios libres. Ofrece solo 2–4 opciones de available_slots y pregunta cuál prefiere.'
            : (
                $dayStart->isSameDay($now) && $now->hour >= $closeHour
                    ? 'El horario de hoy ya cerró ('.$openHour.':00–'.$closeHour.':00). Sugiere mañana u otro día.'
                    : 'No quedan huecos libres en esa fecha dentro del horario '.$openHour.':00–'.$closeHour.':00.'
            );

        return [
            'ok' => true,
            'location' => $location->only(['uuid', 'name']),
            'date' => $dayStart->toDateString(),
            'timezone' => $tz,
            'business_hours' => sprintf('%02d:00–%02d:00', $openHour, $closeHour),
            'duration_minutes' => $duration,
            'booked_count' => count($booked),
            'booked_slots' => $booked,
            // Compat: antes "slots" eran ocupados; ahora no confundir con libres
            'slots' => $booked,
            'available_slots' => $available,
            'suggested_slots' => array_slice($available, 0, 4),
            'available_count' => count($available),
            'message' => $message,
            'hint' => 'Si available_count > 0 hay disponibilidad. booked_slots/slots vacíos significa día sin citas (libre), NO falta de cupo.',
            'assistant_instruction' => 'Ofrece suggested_slots (máx. 4) en tono conversacional. No pegues toda available_slots.',
        ];
    }

    /**
     * @throws \Exception
     */
    private function parseAvailabilityDate(string $raw): Carbon
    {
        $raw = trim($raw);
        if ($raw === '') {
            $raw = 'hoy';
        }

        $tz = 'America/Mexico_City';
        $configuredTz = (string) config('app.timezone', '');
        if ($configuredTz !== '' && $configuredTz !== 'UTC') {
            $tz = $configuredTz;
        }

        $lower = mb_strtolower($raw);
        if (preg_match('/\bhoy\b/u', $lower)) {
            return now($tz)->startOfDay();
        }
        if (preg_match('/\b(mañana|manana)\b/u', $lower)) {
            return now($tz)->addDay()->startOfDay();
        }

        try {
            return Carbon::parse($raw, $tz)->startOfDay();
        } catch (\Throwable $e) {
            throw new Exception('No se pudo interpretar la fecha "'.$raw.'"');
        }
    }

    private function createAppointment(array $args, ?string $callerPhone): array
    {
        try {
            $service = $this->resolveServiceType(
                isset($args['service_type_uuid']) ? (string) $args['service_type_uuid'] : null,
                isset($args['service_code']) ? (string) $args['service_code'] : null,
                isset($args['service_name']) ? (string) $args['service_name'] : null,
            );
            if (! $service) {
                $catalog = CarWashServiceType::query()
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->get(['code', 'name', 'price'])
                    ->take(8)
                    ->map(fn ($s) => $s->code.' = '.$s->name)
                    ->values()
                    ->all();

                return [
                    'ok' => false,
                    'error' => 'Servicio no encontrado. Llama carwash_list_services y pasa service_code exacto (o service_type_uuid).',
                    'hint' => 'No digas al cliente que la cita quedó agendada.',
                    'example_codes' => $catalog,
                ];
            }

            $location = $this->resolveLocation(
                isset($args['location_uuid']) ? (string) $args['location_uuid'] : null,
                isset($args['location_name']) ? (string) $args['location_name'] : null,
            );
            if (! $location) {
                return [
                    'ok' => false,
                    'error' => 'Sede no encontrada. Usa carwash_list_locations y pasa el UUID.',
                    'hint' => 'No digas al cliente que la cita quedó agendada.',
                ];
            }

            $phone = (string) ($args['customer_phone'] ?? $callerPhone ?? '');
            if ($phone === '') {
                return [
                    'ok' => false,
                    'error' => 'Falta teléfono del cliente',
                    'hint' => 'No digas al cliente que la cita quedó agendada.',
                ];
            }

            $customerName = trim((string) ($args['customer_name'] ?? ''));
            if ($customerName === '') {
                return [
                    'ok' => false,
                    'error' => 'Falta nombre del cliente',
                    'hint' => 'No digas al cliente que la cita quedó agendada.',
                ];
            }

            try {
                $rawStart = (string) ($args['scheduled_start_at'] ?? '');
                $start = $this->parseScheduledStart($rawStart);
                $start = $this->ensureSchedulableDate($start, $rawStart);
            } catch (Exception $e) {
                return [
                    'ok' => false,
                    'error' => 'Fecha/hora inválida: '.$e->getMessage().'. Usa YYYY-MM-DD HH:MM con el año actual (America/Mexico_City), p. ej. '.now('America/Mexico_City')->format('Y-m-d').' 16:00.',
                    'hint' => 'No digas al cliente que la cita quedó agendada.',
                ];
            }

            $appointment = $this->appointments->create([
                'location_uuid' => $location->uuid,
                'service_type_uuid' => $service->uuid,
                'customer_name' => $customerName,
                'customer_phone' => $phone,
                // ISO con offset MX: evita doble conversión en AppointmentService.
                'scheduled_start_at' => $start->toIso8601String(),
                'vehicle_plates' => $args['vehicle_plates'] ?? null,
                'vehicle_brand' => $args['vehicle_brand'] ?? null,
                'vehicle_model' => $args['vehicle_model'] ?? null,
                'vehicle_color' => $args['vehicle_color'] ?? null,
                'notes' => $args['notes'] ?? null,
                'channel' => 'whatsapp',
                'status' => 'scheduled',
            ], null);

            $bizTz = CarWashAppointmentService::businessTimezone();
            Log::info('CarWash WhatsApp cita creada', [
                'uuid' => $appointment->uuid,
                'phone' => $phone,
                'start' => optional($appointment->scheduled_start_at)->toIso8601String(),
                'start_local' => optional($appointment->scheduled_start_at)?->timezone($bizTz)->format('Y-m-d H:i'),
            ]);

            return [
                'ok' => true,
                'appointment' => [
                    'uuid' => $appointment->uuid,
                    'status' => $appointment->status,
                    'scheduled_start_at' => optional($appointment->scheduled_start_at)->toIso8601String(),
                    'scheduled_local' => optional($appointment->scheduled_start_at)?->timezone($bizTz)->format('Y-m-d H:i'),
                    'service' => $appointment->serviceType?->name,
                    'location' => $appointment->location?->name,
                    'quoted_price' => $appointment->quoted_price,
                    'vehicle_plates' => $appointment->vehicle_plates,
                ],
            ];
        } catch (Exception $e) {
            Log::warning('CarWash WhatsApp createAppointment failed', [
                'message' => $e->getMessage(),
                'args' => $args,
            ]);

            return [
                'ok' => false,
                'error' => $e->getMessage(),
                'hint' => 'No digas al cliente que la cita quedó agendada. Pide corregir el dato faltante.',
            ];
        }
    }

    private function resolveServiceType(?string $uuid, ?string $codeOrName, ?string $altName = null): ?CarWashServiceType
    {
        if (filled($uuid)) {
            $byUuid = CarWashServiceType::findByUuid($uuid);
            if ($byUuid) {
                return $byUuid;
            }
        }

        $candidates = array_values(array_filter([
            trim((string) $codeOrName),
            trim((string) $altName),
        ], fn ($v) => $v !== ''));

        foreach ($candidates as $raw) {
            $byCode = CarWashServiceType::query()->where('code', $raw)->first();
            if ($byCode) {
                return $byCode;
            }

            $slug = Str::slug($raw);
            if ($slug !== '') {
                $bySlug = CarWashServiceType::query()->where('code', $slug)->first();
                if ($bySlug) {
                    return $bySlug;
                }

                // Alias comerciales (web / IA): "lavado básico", "paquete premium", etc.
                $aliased = $this->resolveServiceAlias($slug);
                if ($aliased) {
                    return $aliased;
                }
            }

            $byName = CarWashServiceType::query()
                ->where('is_active', true)
                ->where(function ($q) use ($raw) {
                    $q->whereRaw('LOWER(name) = ?', [mb_strtolower($raw)])
                        ->orWhere('name', 'like', '%'.$raw.'%');
                })
                ->orderBy('sort_order')
                ->first();
            if ($byName) {
                return $byName;
            }

            $fuzzy = $this->fuzzyMatchServiceType($raw);
            if ($fuzzy) {
                return $fuzzy;
            }
        }

        return null;
    }

    /**
     * Mapea nombres inventados por la web/IA al código real del catálogo.
     */
    private function resolveServiceAlias(string $slug): ?CarWashServiceType
    {
        $slug = trim($slug, '-');
        if ($slug === '') {
            return null;
        }

        $map = [
            // Paquete / nombre "básico" → lavado premium
            'basico' => 'lavado-premium-carroceria',
            'lavado-basico' => 'lavado-premium-carroceria',
            'paquete-basico' => 'lavado-premium-carroceria',
            'lavado-simple' => 'lavado-premium-carroceria',
            'lavado-express' => 'lavado-premium-carroceria',
            'lavado-rapido' => 'lavado-premium-carroceria',
            'lavado-aspirado-secado' => 'lavado-premium-carroceria',
            'lavado-aspirado-y-secado' => 'lavado-premium-carroceria',
            'lavado-premium-de-carroceria' => 'lavado-premium-carroceria',
            'lavado-premium-carroceria' => 'lavado-premium-carroceria',
            // Premium / con pulido → pulido y encerado
            'premium' => 'lavado-pulido-encerado',
            'lavado-premium' => 'lavado-premium-carroceria',
            'paquete-premium' => 'lavado-pulido-encerado',
            'lavado-con-pulido' => 'lavado-pulido-encerado',
            'lavado-aspirado-secado-pulido' => 'lavado-pulido-encerado',
            'lavado-aspirado-secado-y-pulido' => 'lavado-pulido-encerado',
            // Completo / signature / encerado
            'completo' => 'lavado-pulido-encerado',
            'lavado-completo' => 'lavado-pulido-encerado',
            'paquete-completo' => 'lavado-pulido-encerado',
            'signature' => 'lavado-pulido-encerado',
            'paquete-signature' => 'lavado-pulido-encerado',
            'paquete-siganture' => 'lavado-pulido-encerado',
            'lavado-encerado' => 'lavado-pulido-encerado',
            'pulido-encerado' => 'lavado-pulido-encerado',
            'pulido-y-encerado' => 'lavado-pulido-encerado',
            'pulido-y-encerado-de-carroceria' => 'lavado-pulido-encerado',
            // Elite / cerámica
            'elite' => 'nanoceramico',
            'paquete-elite' => 'nanoceramico',
            'nanoceramica' => 'nanoceramico',
            'proteccion-nanoceramica' => 'nanoceramico',
            // Cotización web / nombres públicos
            'descontaminacion-de-rines' => 'descontaminacion-rines',
            'descontaminacion-rines' => 'descontaminacion-rines',
            'detallado-de-pintura-en-rines' => 'detallado-rines',
            'detallado-de-rines' => 'detallado-rines',
            'lavado-exterior-de-motor' => 'lavado-exterior-motor',
            'inflado-de-llantas' => 'nitrogeno-llantas',
            'inflado-de-llanas' => 'nitrogeno-llantas',
            'nitrogeno' => 'nitrogeno-llantas',
            'pintura-de-fasia' => 'pintura-fascia-express',
            'pintura-de-fascia' => 'pintura-fascia-express',
        ];

        // Match exacto o si el slug contiene la clave (ej. "servicio-lavado-basico")
        $code = $map[$slug] ?? null;
        if ($code === null) {
            foreach ($map as $alias => $target) {
                if (str_contains($slug, $alias)) {
                    $code = $target;
                    break;
                }
            }
        }

        if ($code === null) {
            return null;
        }

        $service = CarWashServiceType::query()
            ->where('is_active', true)
            ->where('code', $code)
            ->first();

        if ($service) {
            Log::info('CarWash service alias matched', [
                'slug' => $slug,
                'matched_code' => $service->code,
            ]);
        }

        return $service;
    }

    /**
     * Empareja nombres/códigos inventados por la IA (p. ej. lavado-completo)
     * con el catálogo real (lavado-pulido-encerado).
     */
    private function fuzzyMatchServiceType(string $raw): ?CarWashServiceType
    {
        $needle = $this->normalizeServiceKey($raw);
        if ($needle === '' || mb_strlen($needle) < 4) {
            return null;
        }

        // Alias antes del score genérico
        $aliased = $this->resolveServiceAlias($needle);
        if ($aliased) {
            return $aliased;
        }

        $services = CarWashServiceType::query()->where('is_active', true)->orderBy('sort_order')->get();
        $best = null;
        $bestScore = 0.0;

        foreach ($services as $service) {
            $hayCode = $this->normalizeServiceKey((string) $service->code);
            $hayName = $this->normalizeServiceKey((string) $service->name);
            $score = 0.0;

            if ($hayCode !== '' && (str_contains($hayCode, $needle) || str_contains($needle, $hayCode))) {
                $score = max($score, 0.92);
            }
            if ($hayName !== '' && (str_contains($hayName, $needle) || str_contains($needle, $hayName))) {
                $score = max($score, 0.9);
            }

            similar_text($needle, $hayCode, $pctCode);
            similar_text($needle, $hayName, $pctName);
            $score = max($score, $pctCode / 100, $pctName / 100);

            // Tokens compartidos (encerado, pulido, vestiduras…)
            $needleTokens = array_filter(explode('-', $needle), fn ($t) => mb_strlen($t) > 3);
            $nameTokens = array_filter(explode('-', $hayName), fn ($t) => mb_strlen($t) > 3);
            if ($needleTokens && $nameTokens) {
                $shared = count(array_intersect($needleTokens, $nameTokens));
                if ($shared > 0) {
                    $score = max($score, $shared / max(count($needleTokens), 1) * 0.85 + 0.1);
                }
            }

            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $service;
            }
        }

        if ($best && $bestScore >= 0.72) {
            Log::info('CarWash service fuzzy matched', [
                'raw' => $raw,
                'matched_code' => $best->code,
                'score' => round($bestScore, 3),
            ]);

            return $best;
        }

        return null;
    }

    private function normalizeServiceKey(string $value): string
    {
        $value = mb_strtolower(trim($value));
        $value = Str::ascii($value);
        $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? '';

        return trim($value, '-');
    }

    private function resolveLocation(?string $uuidOrName, ?string $altName = null): ?CarWashLocation
    {
        $candidates = array_values(array_filter([
            trim((string) $uuidOrName),
            trim((string) $altName),
        ], fn ($v) => $v !== ''));

        foreach ($candidates as $raw) {
            $byUuid = CarWashLocation::findByUuid($raw);
            if ($byUuid) {
                return $byUuid;
            }

            $byCode = CarWashLocation::query()->where('code', $raw)->first();
            if ($byCode) {
                return $byCode;
            }

            $byName = CarWashLocation::query()
                ->where('is_active', true)
                ->where(function ($q) use ($raw) {
                    $q->whereRaw('LOWER(name) = ?', [mb_strtolower($raw)])
                        ->orWhere('name', 'like', '%'.$raw.'%');
                })
                ->orderBy('name')
                ->first();
            if ($byName) {
                return $byName;
            }
        }

        // Si solo hay una sede activa, usarla
        $only = CarWashLocation::query()->where('is_active', true)->limit(2)->get();
        if ($only->count() === 1) {
            return $only->first();
        }

        return null;
    }

    /**
     * @throws Exception
     */
    private function parseScheduledStart(string $raw): Carbon
    {
        $raw = trim($raw);
        if ($raw === '') {
            throw new Exception('Fecha vacía');
        }

        $tz = 'America/Mexico_City';
        $configuredTz = (string) config('app.timezone', '');
        if ($configuredTz !== '' && $configuredTz !== 'UTC') {
            $tz = $configuredTz;
        }
        $lower = mb_strtolower($raw);

        // Relativos en español: hoy / mañana + hora opcional
        if (preg_match('/\b(hoy|mañana|manana|today|tomorrow)\b/u', $lower, $dayMatch)) {
            $base = now($tz)->startOfDay();
            $token = $dayMatch[1];
            if (in_array($token, ['mañana', 'manana', 'tomorrow'], true)) {
                $base->addDay();
            }

            $hour = 10;
            $minute = 0;
            // Preferir HH:MM explícito (evita capturar otros dígitos)
            if (preg_match('/\b(\d{1,2})[:\.](\d{2})\b/', $lower, $tm)) {
                $hour = (int) $tm[1];
                $minute = (int) $tm[2];
            } elseif (preg_match('/\b(\d{1,2})\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)\b/iu', $lower, $tm)) {
                $hour = (int) $tm[1];
                $ampm = strtolower(preg_replace('/\s+/', '', (string) ($tm[2] ?? '')));
                if (str_contains($ampm, 'p') && $hour < 12) {
                    $hour += 12;
                } elseif (str_contains($ampm, 'a') && $hour === 12) {
                    $hour = 0;
                }
            } elseif (preg_match('/\b(\d{1,2})\b/', $lower, $tm)) {
                $hour = (int) $tm[1];
                if ($hour >= 1 && $hour <= 7) {
                    $hour += 12;
                }
            }

            if ($hour > 23) {
                $hour = 23;
            }

            return $base->setTime($hour, $minute, 0);
        }

        try {
            $parsed = Carbon::parse($raw, $tz);
        } catch (\Throwable $e) {
            throw new Exception('No se pudo interpretar "'.$raw.'"');
        }

        return $this->ensureSchedulableDate($parsed, $raw);
    }

    /**
     * Corrige años viejos / fechas absurdas y rechaza horarios ya pasados.
     *
     * @throws Exception
     */
    private function ensureSchedulableDate(Carbon $start, ?string $raw = null): Carbon
    {
        $tz = 'America/Mexico_City';
        $configuredTz = (string) config('app.timezone', '');
        if ($configuredTz !== '' && $configuredTz !== 'UTC') {
            $tz = $configuredTz;
        }

        $start = $start->copy()->timezone($tz);
        $now = now($tz);
        $threshold = $now->copy()->subHours(1);
        $raw = (string) $raw;
        $hasIsoDate = (bool) preg_match('/\d{4}-\d{2}-\d{2}/', $raw);
        $hasExplicitDayMonth = (bool) preg_match('/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/ui', $raw)
            || (bool) preg_match('/\b(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/ui', $raw);

        // Solo anclar fechas absurdas (>21 días) inventadas por la IA.
        // No pisar pedidos explícitos del cliente (p. ej. “lunes 14 de septiembre”).
        if ($start->gt($now->copy()->addDays(21)) && ! $hasIsoDate && ! $hasExplicitDayMonth) {
            $candidate = $now->copy()->setTime($start->hour, $start->minute, 0);
            if ($candidate->lt($threshold)) {
                $candidate->addDay();
            }
            Log::warning('CarWash schedule far date snapped near-term', [
                'raw' => $raw,
                'had_iso' => $hasIsoDate,
                'from' => $start->toIso8601String(),
                'to' => $candidate->toIso8601String(),
            ]);
            $start = $candidate;
        }

        // Años viejos (2023…). Traer al año actual / siguiente.
        if ((int) $start->year < (int) $now->year || $start->lt($threshold)) {
            $candidate = $start->copy()->year($now->year);
            if ($candidate->lt($threshold)) {
                $candidate->addYear();
            }
            if ($candidate->gt($now->copy()->addMonths(6))) {
                $candidate = $now->copy()->addDay()->setTime($start->hour, $start->minute, 0);
            }
            Log::warning('CarWash schedule date normalized', [
                'raw' => $raw,
                'from' => $start->toIso8601String(),
                'to' => $candidate->toIso8601String(),
            ]);
            $start = $candidate;
        }

        if ($start->lt($threshold)) {
            throw new Exception(
                'La fecha/hora ya pasó ('.$start->format('Y-m-d H:i').'). Pide un horario futuro; hoy es '.$now->format('Y-m-d')
            );
        }

        if ($start->gt($now->copy()->addMonths(6))) {
            throw new Exception('La fecha está demasiado lejos. Agenda dentro de los próximos 6 meses. Hoy es '.$now->format('Y-m-d').'.');
        }

        return $start;
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

    private function getLoyaltyStamps(array $args, ?string $callerPhone): array
    {
        $phone = (string) ($args['phone'] ?? $callerPhone ?? '');

        return $this->loyalty->lookupByPhone($phone);
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
