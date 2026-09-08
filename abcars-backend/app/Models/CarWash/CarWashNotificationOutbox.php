<?php

namespace App\Models\CarWash;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Ramsey\Uuid\Uuid;

class CarWashNotificationOutbox extends Model
{
    protected $table;

    protected $fillable = [
        'appointment_id', 'channel', 'to_phone', 'template_key', 'body',
        'status', 'attempts', 'sent_at', 'last_error', 'meta',
    ];

    protected $casts = [
        'attempts' => 'integer',
        'sent_at' => 'datetime',
        'meta' => 'array',
    ];

    protected $hidden = ['id'];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->table = env('DB_TABLE_PREFIX', '').'carwash_notification_outbox';
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
