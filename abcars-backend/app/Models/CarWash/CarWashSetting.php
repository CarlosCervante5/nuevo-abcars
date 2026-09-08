<?php

namespace App\Models\CarWash;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;
use Ramsey\Uuid\Uuid;

class CarWashSetting extends Model
{
    protected $fillable = ['key', 'value'];

    protected $casts = [
        'value' => 'array',
    ];

    protected $hidden = ['id'];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->table = env('DB_TABLE_PREFIX', '').'carwash_settings';
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Uuid::uuid4();
            }
        });
    }

    public static function tableReady(): bool
    {
        try {
            return Schema::hasTable((new static)->getTable());
        } catch (\Throwable) {
            return false;
        }
    }

    public static function getJson(string $key, array $default = []): array
    {
        if (! static::tableReady()) {
            return $default;
        }

        try {
            $row = static::query()->where('key', $key)->first();
            if (! $row || ! is_array($row->value)) {
                return $default;
            }

            return $row->value;
        } catch (\Throwable) {
            return $default;
        }
    }

    public static function putJson(string $key, array $value): self
    {
        if (! static::tableReady()) {
            throw new \RuntimeException('Tabla carwash_settings no existe. Ejecuta migraciones / bootstrap.');
        }

        $row = static::query()->firstOrNew(['key' => $key]);
        $row->value = $value;
        $row->save();

        return $row;
    }
}
