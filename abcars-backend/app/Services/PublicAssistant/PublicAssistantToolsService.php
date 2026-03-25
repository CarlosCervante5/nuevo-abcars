<?php

namespace App\Services\PublicAssistant;

use App\Models\Customer;
use App\Models\CustomerAppointment;
use App\Models\Dealership;
use App\Models\Vehicle;
use Carbon\Carbon;

class PublicAssistantToolsService
{
    // Campos NUNCA expuestos al público
    private const FORBIDDEN_FIELDS = [
        'id', 'vin', 'purchase_date', 'sale_price',
        'customer_id', 'vehicle_id', 'referrer_user_id', 'deleted_at',
    ];

    // Traducción de valores de campos
    private const TRANSMISSION_MAP = [
        'automatic' => 'Automática',
        'manual'    => 'Manual',
        'cvt'       => 'CVT',
    ];

    private const FUEL_MAP = [
        'gasoline' => 'Gasolina',
        'diesel'   => 'Diésel',
        'hybrid'   => 'Híbrido',
        'electric' => 'Eléctrico',
        'gas'      => 'Gas',
    ];

    private const CATEGORY_MAP = [
        'pre_owned' => 'Seminuevo',
        'new'       => 'Nuevo',
        'certified' => 'Certificado',
    ];

    private const TYPE_MAP = [
        'car'   => 'Auto',
        'suv'   => 'SUV',
        'truck' => 'Camioneta',
        'van'   => 'Van',
        'sedan' => 'Sedán',
    ];

    public function execute(string $toolName, array $arguments): array
    {
        return match ($toolName) {
            'search_public_vehicles' => $this->searchPublicVehicles($arguments),
            'get_vehicle_details'    => $this->getVehicleDetails($arguments),
            'create_appointment'     => $this->createAppointment($arguments),
            'confirm_appointment'    => $this->confirmAppointment($arguments),
            'get_appointment_status' => $this->getAppointmentStatus($arguments),
            default => ['error' => "Herramienta desconocida: {$toolName}"],
        };
    }

    public function getToolsDefinitions(): array
    {
        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'search_public_vehicles',
                    'description' => 'Busca vehículos disponibles en el inventario público de ABCars. ' .
                        'Campos disponibles por vehículo: nombre, marca, linea, modelo, año, precio_lista, precio_oferta, ' .
                        'km (kilometraje), combustible, transmision, color_exterior, categoria, tipo, sucursal, imagen. ' .
                        'Usa sort_by para ordenar: newest_year=año más reciente, lowest_km=menos kilometraje, ' .
                        'cheapest=más barato, most_expensive=más caro.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'keyword'   => ['type' => 'string', 'description' => 'Texto libre: nombre, marca o modelo.'],
                            'brand'     => ['type' => 'string', 'description' => 'Marca (ej: chevrolet, toyota, nissan).'],
                            'category'  => ['type' => 'string', 'enum' => ['pre_owned', 'new', 'certified'], 'description' => 'Categoría: pre_owned=seminuevo, new=nuevo, certified=certificado.'],
                            'fuel_type' => ['type' => 'string', 'enum' => ['gasoline', 'diesel', 'hybrid', 'electric', 'gas'], 'description' => 'Tipo de combustible.'],
                            'transmission' => ['type' => 'string', 'enum' => ['automatic', 'manual', 'cvt'], 'description' => 'Transmisión.'],
                            'min_price' => ['type' => 'number', 'description' => 'Precio mínimo de lista en MXN.'],
                            'max_price' => ['type' => 'number', 'description' => 'Precio máximo de lista en MXN.'],
                            'min_year'  => ['type' => 'integer', 'description' => 'Año mínimo del modelo.'],
                            'max_year'  => ['type' => 'integer', 'description' => 'Año máximo del modelo.'],
                            'sort_by'   => [
                                'type' => 'string',
                                'enum' => ['newest', 'cheapest', 'most_expensive', 'lowest_km', 'newest_year'],
                                'description' => 'Ordenar: newest=más recientes, cheapest=más baratos, most_expensive=más caros, lowest_km=menos km, newest_year=año más reciente.',
                            ],
                        ],
                        'required' => [],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_vehicle_details',
                    'description' => 'Obtiene todos los detalles de un vehículo por UUID: imágenes, especificaciones, descripción completa.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'uuid' => ['type' => 'string', 'description' => 'UUID del vehículo.'],
                        ],
                        'required' => ['uuid'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'create_appointment',
                    'description' => 'Agenda una cita para visitar una sucursal. Recopila: nombre, teléfono (10 dígitos), email, sucursal y fecha futura.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'name'           => ['type' => 'string', 'description' => 'Nombre completo del cliente.'],
                            'phone'          => ['type' => 'string', 'description' => 'Teléfono 10 dígitos.'],
                            'email'          => ['type' => 'string', 'description' => 'Correo electrónico.'],
                            'dealership_name'=> ['type' => 'string', 'description' => 'Nombre de la sucursal.'],
                            'scheduled_date' => ['type' => 'string', 'description' => 'Fecha y hora: YYYY-MM-DD HH:mm.'],
                            'vehicle_uuid'   => ['type' => 'string', 'description' => 'UUID del vehículo de interés (opcional).'],
                        ],
                        'required' => ['name', 'phone', 'email', 'dealership_name', 'scheduled_date'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'confirm_appointment',
                    'description' => 'Confirma una cita existente con su código UUID.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'uuid' => ['type' => 'string', 'description' => 'UUID de la cita.'],
                        ],
                        'required' => ['uuid'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_appointment_status',
                    'description' => 'Consulta el estado de una cita por UUID.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'uuid' => ['type' => 'string', 'description' => 'UUID de la cita.'],
                        ],
                        'required' => ['uuid'],
                    ],
                ],
            ],
        ];
    }

    private function searchPublicVehicles(array $args): array
    {
        $prefix = env('DB_TABLE_PREFIX', '');
        $table  = $prefix . 'vehicles';
        $lmTable = $prefix . 'line_models';

        $query = Vehicle::with(['brand', 'line', 'model', 'dealership', 'firstImage'])
            ->where("{$table}.page_status", 'active');

        if (!empty($args['keyword'])) {
            $kw = $args['keyword'];
            $query->where(function ($q) use ($kw) {
                $q->where('name', 'like', "%{$kw}%")
                    ->orWhereHas('brand', fn ($b) => $b->where('name', 'like', "%{$kw}%"))
                    ->orWhereHas('model', fn ($m) => $m->where('name', 'like', "%{$kw}%"));
            });
        }

        if (!empty($args['brand'])) {
            $b = $args['brand'];
            $query->whereHas('brand', fn ($q) => $q->where('name', 'like', "%{$b}%"));
        }

        if (!empty($args['category'])) {
            $query->where('category', $args['category']);
        }

        if (!empty($args['fuel_type'])) {
            $query->where('fuel_type', $args['fuel_type']);
        }

        if (!empty($args['transmission'])) {
            $query->where('transmission', $args['transmission']);
        }

        if (isset($args['min_price'])) {
            $query->where('list_price', '>=', $args['min_price']);
        }

        if (isset($args['max_price'])) {
            $query->where('list_price', '<=', $args['max_price']);
        }

        if (!empty($args['min_year']) || !empty($args['max_year'])) {
            $query->whereHas('model', function ($q) use ($args) {
                if (!empty($args['min_year'])) {
                    $q->where('year', '>=', $args['min_year']);
                }
                if (!empty($args['max_year'])) {
                    $q->where('year', '<=', $args['max_year']);
                }
            });
        }

        $sortBy = $args['sort_by'] ?? 'newest';

        switch ($sortBy) {
            case 'cheapest':
                $query->orderBy("{$table}.list_price", 'asc');
                break;
            case 'most_expensive':
                $query->orderBy("{$table}.list_price", 'desc');
                break;
            case 'lowest_km':
                $query->orderBy("{$table}.mileage", 'asc');
                break;
            case 'newest_year':
                $query->leftJoin("{$lmTable} as lm_sort", "lm_sort.id", '=', "{$table}.model_id")
                    ->orderBy('lm_sort.year', 'desc')
                    ->select("{$table}.*");
                break;
            default:
                $query->orderBy("{$table}.created_at", 'desc');
        }

        $vehicles = $query->take(10)->get();

        return [
            'total_encontrados' => $vehicles->count(),
            'vehiculos' => $vehicles->map(fn ($v) => $this->formatPublicVehicle($v))->toArray(),
        ];
    }

    private function getVehicleDetails(array $args): array
    {
        $uuid = $args['uuid'] ?? null;
        if (!$uuid) {
            return ['error' => 'Se requiere el UUID del vehículo.'];
        }

        $vehicle = Vehicle::with(['brand', 'line', 'model', 'version', 'dealership', 'images', 'specification'])
            ->where('uuid', $uuid)
            ->where('page_status', 'active')
            ->first();

        if (!$vehicle) {
            return ['error' => 'No se encontró un vehículo activo con ese código.'];
        }

        $data = [
            'uuid'           => $vehicle->uuid,
            'nombre'         => $vehicle->name,
            'marca'          => $vehicle->brand?->name,
            'linea'          => $vehicle->line?->name,
            'modelo'         => $vehicle->model?->name,
            'año'            => $vehicle->model?->year,
            'version'        => $vehicle->version?->name,
            'precio_lista'   => $vehicle->list_price ? '$' . number_format($vehicle->list_price, 0, '.', ',') . ' MXN' : null,
            'precio_oferta'  => $vehicle->offer_price ? '$' . number_format($vehicle->offer_price, 0, '.', ',') . ' MXN' : null,
            'km'             => $vehicle->mileage ? number_format($vehicle->mileage, 0, '.', ',') . ' km' : null,
            'combustible'    => self::FUEL_MAP[$vehicle->fuel_type] ?? $vehicle->fuel_type,
            'transmision'    => self::TRANSMISSION_MAP[$vehicle->transmission] ?? $vehicle->transmission,
            'color_exterior' => $vehicle->exterior_color,
            'color_interior' => $vehicle->interior_color,
            'categoria'      => self::CATEGORY_MAP[$vehicle->category] ?? $vehicle->category,
            'tipo'           => self::TYPE_MAP[$vehicle->type] ?? $vehicle->type,
            'cilindros'      => $vehicle->cylinders,
            'traccion'       => $vehicle->drive_train,
            'descripcion'    => $vehicle->description,
            'sucursal'       => $vehicle->dealership?->name,
            'imagenes'       => $vehicle->images->map(fn ($img) => $img->service_image_url)->toArray(),
        ];

        if ($vehicle->specification) {
            $spec = $vehicle->specification;
            $data['especificaciones'] = array_filter([
                'llaves'            => $spec->keys_number,
                'llanta_refaccion'  => $spec->spare_wheel,
                'gato_hidraulico'   => $spec->hydraulic_jack,
                'cables_pasa_corriente' => $spec->jumper_cables,
                'tipo_motor'        => $spec->engine_type,
                'placas'            => $spec->plates,
                'pais_origen'       => $spec->country_of_origin,
                'garantia_poliza'   => $spec->warranty_policy,
                'manual_garantia'   => $spec->warranty_manual,
            ], fn ($v) => !is_null($v));
        }

        return $data;
    }

    private function createAppointment(array $args): array
    {
        $errors = [];
        $name          = $args['name'] ?? '';
        $phone         = $args['phone'] ?? '';
        $email         = $args['email'] ?? '';
        $dealershipName = $args['dealership_name'] ?? '';
        $scheduledDate = $args['scheduled_date'] ?? '';
        $vehicleUuid   = $args['vehicle_uuid'] ?? null;

        if (strlen(trim($name)) < 2) {
            $errors[] = 'El nombre debe tener al menos 2 caracteres.';
        }
        if (!preg_match('/^\d{10}$/', $phone)) {
            $errors[] = 'El teléfono debe tener exactamente 10 dígitos.';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'El correo electrónico no tiene un formato válido.';
        }

        $parsedDate = null;
        try {
            $parsedDate = Carbon::parse($scheduledDate);
            if ($parsedDate->isPast()) {
                $errors[] = 'La fecha de la cita debe ser una fecha futura.';
            }
        } catch (\Exception $e) {
            $errors[] = 'La fecha proporcionada no es válida.';
        }

        $dealership = Dealership::whereRaw('LOWER(name) = ?', [strtolower(trim($dealershipName))])->first();
        if (!$dealership) {
            $available = Dealership::pluck('name')->implode(', ');
            $errors[] = "La sucursal '{$dealershipName}' no existe. Sucursales disponibles: {$available}.";
        }

        if (!empty($errors)) {
            return ['error' => implode(' ', $errors)];
        }

        $customer = Customer::where('phone_1', $phone)->orWhere('email_1', $email)->first();
        if (!$customer) {
            $customer = Customer::create([
                'name'    => $name,
                'phone_1' => $phone,
                'email_1' => $email,
            ]);
        }

        $appointmentData = [
            'type'           => 'visit',
            'status'         => 'scheduled',
            'dealership_name'=> $dealership->name,
            'scheduled_date' => $parsedDate->format('Y-m-d H:i:s'),
            'customer_id'    => $customer->id,
        ];

        if ($vehicleUuid) {
            $vehicle = Vehicle::where('uuid', $vehicleUuid)->where('page_status', 'active')->first();
            if ($vehicle) {
                $appointmentData['description'] = "Vehículo de interés: {$vehicle->name}";
            }
        }

        $appointment = CustomerAppointment::create($appointmentData);

        return [
            'codigo_cita'   => $appointment->uuid,
            'fecha'         => Carbon::parse($appointment->scheduled_date)->format('d/m/Y H:i'),
            'sucursal'      => $appointment->dealership_name,
            'estado'        => 'Agendada',
            'mensaje'       => 'Tu cita ha sido agendada exitosamente. Guarda tu código de cita para consultarla o confirmarla.',
        ];
    }

    private function confirmAppointment(array $args): array
    {
        $uuid = $args['uuid'] ?? null;
        if (!$uuid) {
            return ['error' => 'Se requiere el código de la cita.'];
        }

        $appointment = CustomerAppointment::where('uuid', $uuid)->first();
        if (!$appointment) {
            return ['error' => 'No se encontró una cita con ese código.'];
        }

        if ($appointment->status !== 'scheduled') {
            $estados = [
                'confirmed' => 'ya está confirmada',
                'completed' => 'ya fue completada',
                'cancelled' => 'fue cancelada',
            ];
            $msg = $estados[$appointment->status] ?? "tiene estado: {$appointment->status}";
            return [
                'mensaje'  => "Tu cita {$msg}.",
                'estado'   => $appointment->status,
                'fecha'    => Carbon::parse($appointment->scheduled_date)->format('d/m/Y H:i'),
                'sucursal' => $appointment->dealership_name,
            ];
        }

        $appointment->status = 'confirmed';
        $appointment->save();

        return [
            'mensaje'  => '¡Cita confirmada exitosamente! Te esperamos.',
            'estado'   => 'Confirmada',
            'fecha'    => Carbon::parse($appointment->scheduled_date)->format('d/m/Y H:i'),
            'sucursal' => $appointment->dealership_name,
        ];
    }

    private function getAppointmentStatus(array $args): array
    {
        $uuid = $args['uuid'] ?? null;
        if (!$uuid) {
            return ['error' => 'Se requiere el código de la cita.'];
        }

        $appointment = CustomerAppointment::where('uuid', $uuid)->first();
        if (!$appointment) {
            return ['error' => 'No se encontró una cita con ese código.'];
        }

        $estados = [
            'scheduled' => 'Agendada',
            'confirmed' => 'Confirmada',
            'completed' => 'Completada',
            'cancelled' => 'Cancelada',
        ];

        return [
            'estado'   => $estados[$appointment->status] ?? $appointment->status,
            'fecha'    => Carbon::parse($appointment->scheduled_date)->format('d/m/Y H:i'),
            'sucursal' => $appointment->dealership_name,
            'tipo'     => $appointment->type === 'visit' ? 'Visita' : $appointment->type,
        ];
    }

    private function formatPublicVehicle(Vehicle $vehicle): array
    {
        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:4200'));

        return [
            'uuid'          => $vehicle->uuid,
            'nombre'        => $vehicle->name,
            'marca'         => $vehicle->brand?->name,
            'linea'         => $vehicle->line?->name,
            'modelo'        => $vehicle->model?->name,
            'año'           => $vehicle->model?->year,
            'precio_lista'  => $vehicle->list_price ? '$' . number_format($vehicle->list_price, 0, '.', ',') . ' MXN' : null,
            'precio_oferta' => $vehicle->offer_price ? '$' . number_format($vehicle->offer_price, 0, '.', ',') . ' MXN' : null,
            'km'            => $vehicle->mileage ? number_format($vehicle->mileage, 0, '.', ',') . ' km' : null,
            'combustible'   => self::FUEL_MAP[$vehicle->fuel_type] ?? $vehicle->fuel_type,
            'transmision'   => self::TRANSMISSION_MAP[$vehicle->transmission] ?? $vehicle->transmission,
            'color'         => $vehicle->exterior_color,
            'categoria'     => self::CATEGORY_MAP[$vehicle->category] ?? $vehicle->category,
            'tipo'          => self::TYPE_MAP[$vehicle->type] ?? $vehicle->type,
            'sucursal'      => $vehicle->dealership?->name,
            'imagen'        => $vehicle->firstImage?->service_image_url,
            'url_detalle'   => "{$frontendUrl}/vehiculo/{$vehicle->uuid}",
        ];
    }
}
