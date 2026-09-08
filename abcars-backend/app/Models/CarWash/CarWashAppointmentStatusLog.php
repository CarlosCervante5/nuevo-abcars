<?php

namespace App\Models\CarWash;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Ramsey\Uuid\Uuid;

class CarWashAppointmentStatusLog extends Model
{
    protected $table;

    protected $fillable = [
        'appointment_id', 'from_status', 'to_status', 'user_id', 'source', 'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    protected $hidden = ['id'];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->table = env('DB_TABLE_PREFIX', '').'carwash_appointment_status_logs';
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

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(CarWashAppointment::class, 'appointment_id');
    }
}
