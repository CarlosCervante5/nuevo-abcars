<?php

namespace App\Services\Assistant;

use App\Models\CustomerAppointment;
use App\Models\Dealership;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Valuations\VehicleValuation;
use Carbon\Carbon;
use Spatie\Permission\Models\Role;

class AssistantToolsService
{
    /**
     * Ejecuta una herramienta solicitada por el asistente.
     */
    public function execute(string $toolName, array $arguments): array
    {
        return match ($toolName) {
            'search_vehicles' => $this->searchVehicles($arguments),
            'get_vehicle_inventory_info' => $this->getVehicleInventoryInfo($arguments),
            'get_users' => $this->getUsers($arguments),
            'get_valuations' => $this->getValuations($arguments),
            'get_dealerships' => $this->getDealerships(),
            'get_appointments' => $this->getAppointments($arguments),
            'get_general_stats' => $this->getGeneralStats(),
            default => ['error' => "Herramienta desconocida: {$toolName}"],
        };
    }

    /**
     * Busca vehículos por nombre, marca o palabra clave.
     */
    public function searchVehicles(array $args): array
    {
        $query = Vehicle::with(['brand', 'model', 'dealership']);
        $limit = min((int) ($args['limit'] ?? 20), 50);

        if (!empty($args['keyword'])) {
            $kw = $args['keyword'];
            $query->where(function ($q) use ($kw) {
                $q->where('name', 'like', "%{$kw}%")
                    ->orWhereHas('brand', fn ($b) => $b->where('name', 'like', "%{$kw}%"))
                    ->orWhereHas('model', fn ($m) => $m->where('name', 'like', "%{$kw}%"));
            });
        }

        if (!empty($args['status'])) {
            $query->where('page_status', $args['status']);
        }

        $vehicles = $query->orderBy('created_at', 'desc')->take($limit)->get();

        return [
            'total_encontrados' => $vehicles->count(),
            'vehiculos' => $vehicles->map(fn ($v) => $this->formatVehicleWithDays($v))->toArray(),
        ];
    }

    /**
     * Obtiene información de días en inventario (por vehículo o promedios).
     */
    public function getVehicleInventoryInfo(array $args): array
    {
        $vehicleName = $args['vehicle_name'] ?? null;

        if ($vehicleName) {
            $vehicle = Vehicle::with(['brand', 'model', 'dealership'])
                ->where('name', 'like', "%{$vehicleName}%")
                ->first();

            if (!$vehicle) {
                return ['encontrado' => false, 'mensaje' => "No se encontró vehículo con nombre similar a: {$vehicleName}"];
            }

            return [
                'encontrado' => true,
                'vehiculo' => $this->formatVehicleWithDays($vehicle),
            ];
        }

        $vehicles = Vehicle::whereNotNull('created_at')->get();
        $diasPorVehiculo = $vehicles->map(fn ($v) => Carbon::parse($v->getRawOriginal('created_at'))->diffInDays(now()));

        $conMasDias = Vehicle::with(['brand', 'model'])
            ->orderBy('created_at', 'asc')
            ->take(5)
            ->get()
            ->map(fn ($v) => $this->formatVehicleWithDays($v))
            ->toArray();

        return [
            'promedio_dias_inventario' => $diasPorVehiculo->isNotEmpty() ? round($diasPorVehiculo->avg(), 0) : 0,
            'total_vehiculos' => $vehicles->count(),
            'vehiculos_mas_tiempo_inventario' => $conMasDias,
        ];
    }

    /**
     * Obtiene usuarios (total o por rol).
     */
    public function getUsers(array $args): array
    {
        $role = $args['role'] ?? null;

        if ($role) {
            $count = User::role($role)->count();
            return ['rol' => $role, 'total' => $count];
        }

        $total = User::count();
        $byRole = [];
        foreach (Role::all() as $r) {
            $byRole[$r->name] = User::role($r->name)->count();
        }

        return ['total' => $total, 'por_rol' => $byRole];
    }

    /**
     * Obtiene valuaciones (total, por estado o por periodo).
     */
    public function getValuations(array $args): array
    {
        $status = $args['status'] ?? null;
        $period = $args['period'] ?? null;

        $query = VehicleValuation::query();

        if ($status) {
            $query->where('status', $status);
        }

        if ($period === 'este_mes') {
            $query->whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year);
        } elseif ($period === 'este_año') {
            $query->whereYear('created_at', Carbon::now()->year);
        }

        $total = $query->count();

        if (!$status && !$period) {
            $byStatus = VehicleValuation::selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->get()
                ->pluck('total', 'status')
                ->toArray();
            return ['total' => $total, 'por_estado' => $byStatus];
        }

        $result = ['total' => $total];
        if ($status) {
            $result['estado'] = $status;
        }
        if ($period) {
            $result['periodo'] = $period;
        }
        return $result;
    }

    /**
     * Obtiene sucursales.
     */
    public function getDealerships(): array
    {
        $dealerships = Dealership::select('id', 'name', 'location', 'description')->get()->toArray();
        return ['sucursales' => $dealerships, 'total' => count($dealerships)];
    }

    /**
     * Obtiene citas.
     */
    public function getAppointments(array $args): array
    {
        $total = CustomerAppointment::count();
        return ['total' => $total];
    }

    /**
     * Resumen general del sistema.
     */
    public function getGeneralStats(): array
    {
        return [
            'usuarios' => User::count(),
            'vehiculos' => Vehicle::count(),
            'vehiculos_activos' => Vehicle::where('page_status', 'active')->count(),
            'sucursales' => Dealership::count(),
            'valuaciones' => VehicleValuation::count(),
            'citas' => CustomerAppointment::count(),
        ];
    }

    private function formatVehicleWithDays(Vehicle $v): array
    {
        $createdAt = $v->getRawOriginal('created_at') ?? $v->created_at;
        $dias = $createdAt ? Carbon::parse($createdAt)->diffInDays(now()) : null;

        return [
            'name' => $v->name,
            'brand' => $v->brand?->name,
            'sale_price' => $v->sale_price,
            'page_status' => $v->page_status,
            'dealership' => $v->dealership?->name,
            'fecha_publicacion' => $createdAt ? Carbon::parse($createdAt)->format('Y-m-d') : null,
            'dias_en_inventario' => $dias,
        ];
    }
}
