<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Dealership extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table;

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->table = env('DB_TABLE_PREFIX', '') . 'dealerships';
    }

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'location',
        'service_types',
        'description',
        'address',
        'latitude',
        'longitude',
    ];

    public const SERVICE_TYPE_VENTA = 'venta';

    public const SERVICE_TYPE_SERVICIOS = 'servicios';

    public const SERVICE_TYPE_VALUACIONES = 'valuaciones';

    /**
     * @return list<string>
     */
    public static function serviceTypes(): array
    {
        return [
            self::SERVICE_TYPE_VENTA,
            self::SERVICE_TYPE_VALUACIONES,
            self::SERVICE_TYPE_SERVICIOS,
        ];
    }

    /**
     * @param  array<int, mixed>  $types
     * @return list<string>
     */
    public static function normalizeServiceTypesArray(array $types): array
    {
        $allowed = self::serviceTypes();
        $out = [];
        foreach ($types as $v) {
            $v = is_string($v) ? strtolower(trim($v)) : '';
            if (in_array($v, $allowed, true) && ! in_array($v, $out, true)) {
                $out[] = $v;
            }
        }
        if ($out === []) {
            return [self::SERVICE_TYPE_VENTA];
        }
        $order = array_flip($allowed);
        usort($out, fn ($a, $b) => ($order[$a] ?? 99) <=> ($order[$b] ?? 99));

        return $out;
    }

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'service_types' => 'array',
    ];

    /**
     * @var array<int, string>
     */
    protected $hidden = [
        'updated_at',
        'deleted_at',
    ];

    protected $dates = ['created_at', 'updated_at', 'deleted_at'];

    public function getCreatedAtAttribute($value)
    {
        return $value ? Carbon::parse($value)->format('Y-m-d H:i:s') : null;
    }

    public function getUpdatedAtAttribute($value)
    {
        return $value ? Carbon::parse($value)->format('Y-m-d H:i:s') : null;
    }

    public function getDeletedAtAttribute($value)
    {
        return $value ? Carbon::parse($value)->format('Y-m-d H:i:s') : null;
    }

    protected function setNameAttribute($value)
    {
        $this->attributes['name'] = strtolower($value);
    }

    protected function setLocationAttribute($value)
    {
        $this->attributes['location'] = strtolower($value);
    }

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class, 'dealership_id');
    }

    public function offersValuationService(): bool
    {
        foreach ($this->service_types ?? [] as $t) {
            if (is_string($t) && strtolower(trim($t)) === self::SERVICE_TYPE_VALUACIONES) {
                return true;
            }
        }

        return false;
    }

    /**
     * Texto típico en cita o en user_profiles.location → nombre canónico en dealerships.name (minúsculas).
     *
     * @var array<string, string>
     */
    protected static array $legacyBranchAliases = [
        'chevrolet puebla' => 'ventas matriz',
        'chevy puebla' => 'ventas matriz',
        'matriz chevrolet' => 'ventas matriz',
        'chevrolet matriz' => 'ventas matriz',
        'chevrolet serdan' => 'ventas serdan',
        'chevrolet serdán' => 'ventas serdan',
        'chevrolet serdán.' => 'ventas serdan',
    ];

    /**
     * Misma prioridad visual que sucursales públicas (fallback cuando varias comparten ciudad).
     *
     * @var array<string, int>
     */
    protected static array $branchStableOrder = [
        'ventas matriz' => 1,
        'ventas serdan' => 2,
        'ventas sucursal tlaxcala' => 3,
        'service body paint' => 4,
        'ventas sucursal hidalgo' => 5,
        'ventas sucursal cholula' => 6,
    ];

    /**
     * Resuelve sucursal por el valor guardado en customer_appointments.dealership_name.
     */
    public static function resolveFromAppointmentDealershipName(?string $appointmentName): ?self
    {
        $raw = trim((string) $appointmentName);
        if ($raw === '') {
            return null;
        }

        $key = mb_strtolower($raw, 'UTF-8');
        $canonical = static::$legacyBranchAliases[$key] ?? $key;

        return static::query()
            ->whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower(trim($canonical), 'UTF-8')])
            ->first();
    }

    /**
     * Si el nombre de la cita no matchea, usa user_profiles.location del valuador (alias o ciudad).
     */
    public static function resolveFromValuatorUserProfile(?User $user): ?self
    {
        if (! $user) {
            return null;
        }

        $user->loadMissing('userProfile');
        $raw = trim((string) ($user->userProfile?->location ?? ''));
        if ($raw === '') {
            return null;
        }

        $key = mb_strtolower($raw, 'UTF-8');

        if (isset(static::$legacyBranchAliases[$key])) {
            $byAlias = static::resolveFromAppointmentDealershipName(static::$legacyBranchAliases[$key]);
            if ($byAlias) {
                return $byAlias;
            }
        }

        $byName = static::resolveFromAppointmentDealershipName($raw);
        if ($byName) {
            return $byName;
        }

        return static::pickValuationDealershipByLocationKey($key);
    }

    /**
     * Sucursales cuyo campo location coincide. Prioriza filas que declaran servicio valuaciones (JSON);
     * si todas vienen legacy sin service_types, usa igualmente la mejor candidata por orden público.
     */
    protected static function pickValuationDealershipByLocationKey(string $locationKey): ?self
    {
        /** @var Collection<int, self> $byLocation */
        $byLocation = static::query()
            ->whereRaw('LOWER(TRIM(location)) = ?', [$locationKey])
            ->orderBy('id')
            ->get();

        if ($byLocation->isEmpty()) {
            return null;
        }

        /** @var Collection<int, self> $candidates */
        $candidates = $byLocation->filter(fn (self $d) => $d->offersValuationService())->values();
        if ($candidates->isEmpty()) {
            $candidates = $byLocation->values();
        }

        if ($candidates->count() === 1) {
            return $candidates->first();
        }

        return $candidates->sortBy(function (self $d) {
            $n = mb_strtolower(trim((string) $d->name), 'UTF-8');

            return static::$branchStableOrder[$n] ?? 99;
        })->first();
    }

    /**
     * Sucursales ordenadas sin duplicados lógicos (mismo nombre + ubicación, ignorando mayúsculas/espacios).
     * Si existen filas duplicadas en BD, se conserva la de id menor.
     *
     * @return \Illuminate\Support\Collection<int, self>
     */
    public static function listOrderedUnique(): \Illuminate\Support\Collection
    {
        return static::query()
            ->orderBy('name')
            ->orderBy('id')
            ->get()
            ->unique(function (self $d) {
                $name = mb_strtolower(trim((string) $d->name), 'UTF-8');
                $loc = mb_strtolower(trim((string) $d->location), 'UTF-8');

                return $name."\0".$loc;
            })
            ->values();
    }
}
