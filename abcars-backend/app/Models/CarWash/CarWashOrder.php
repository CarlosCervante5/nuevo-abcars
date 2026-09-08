<?php

namespace App\Models\CarWash;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CarWashOrder extends CarWashModel
{
    protected $fillable = [
        'location_id', 'appointment_id', 'cashier_user_id', 'status',
        'customer_name', 'customer_phone', 'subtotal', 'total',
        'payment_method', 'paid_at', 'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'total' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    protected $hidden = ['id', 'deleted_at'];

    protected function tableSuffix(): string
    {
        return 'carwash_orders';
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(CarWashLocation::class, 'location_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(CarWashAppointment::class, 'appointment_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(CarWashOrderItem::class, 'order_id');
    }
}
