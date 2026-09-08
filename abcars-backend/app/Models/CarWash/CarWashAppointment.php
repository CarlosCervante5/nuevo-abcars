<?php

namespace App\Models\CarWash;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CarWashAppointment extends CarWashModel
{
    public const STATUSES = [
        'draft',
        'scheduled',
        'checked_in',
        'in_progress',
        'ready',
        'delivered',
        'cancelled',
        'no_show',
    ];

    protected $fillable = [
        'location_id', 'service_type_id', 'bay_id', 'washer_id',
        'customer_name', 'customer_phone',
        'vehicle_plates', 'vehicle_brand', 'vehicle_model', 'vehicle_color',
        'status', 'channel',
        'scheduled_start_at', 'scheduled_end_at',
        'checked_in_at', 'started_at', 'ready_at', 'delivered_at', 'cancelled_at',
        'notes', 'quoted_price', 'created_by',
    ];

    protected $casts = [
        'scheduled_start_at' => 'datetime',
        'scheduled_end_at' => 'datetime',
        'checked_in_at' => 'datetime',
        'started_at' => 'datetime',
        'ready_at' => 'datetime',
        'delivered_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'quoted_price' => 'decimal:2',
    ];

    protected $hidden = ['id', 'deleted_at'];

    protected function tableSuffix(): string
    {
        return 'carwash_appointments';
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(CarWashLocation::class, 'location_id');
    }

    public function serviceType(): BelongsTo
    {
        return $this->belongsTo(CarWashServiceType::class, 'service_type_id');
    }

    public function bay(): BelongsTo
    {
        return $this->belongsTo(CarWashBay::class, 'bay_id');
    }

    public function washer(): BelongsTo
    {
        return $this->belongsTo(CarWashWasher::class, 'washer_id');
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(CarWashAppointmentStatusLog::class, 'appointment_id');
    }
}
