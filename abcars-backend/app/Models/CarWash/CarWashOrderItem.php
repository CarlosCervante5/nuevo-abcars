<?php

namespace App\Models\CarWash;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Ramsey\Uuid\Uuid;

class CarWashOrderItem extends Model
{
    protected $table;

    protected $fillable = [
        'order_id', 'item_type', 'item_id', 'name', 'quantity', 'unit_price', 'line_total',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    protected $hidden = ['id'];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->table = env('DB_TABLE_PREFIX', '').'carwash_order_items';
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

    public function order(): BelongsTo
    {
        return $this->belongsTo(CarWashOrder::class, 'order_id');
    }
}
