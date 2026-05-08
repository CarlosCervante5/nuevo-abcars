<?php

namespace App\Models;

use Carbon\Carbon;
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
