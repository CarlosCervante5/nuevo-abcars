<?php

namespace App\Models\CarWash;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

abstract class CarWashModel extends Model
{
    use SoftDeletes;

    protected $table;

    abstract protected function tableSuffix(): string;

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->table = env('DB_TABLE_PREFIX', '').$this->tableSuffix();
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

    public static function findByUuid(string $uuid): ?static
    {
        return static::query()->where('uuid', $uuid)->first();
    }
}
