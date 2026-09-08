<?php

namespace App\Models\CarWash;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Ramsey\Uuid\Uuid;

class CarWashLoyaltyStamp extends Model
{
    protected $fillable = [
        'loyalty_card_id',
        'appointment_id',
        'cycle_number',
        'source',
    ];

    protected $casts = [
        'cycle_number' => 'integer',
    ];

    protected $hidden = ['id'];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->table = env('DB_TABLE_PREFIX', '').'carwash_loyalty_stamps';
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

    public function card(): BelongsTo
    {
        return $this->belongsTo(CarWashLoyaltyCard::class, 'loyalty_card_id');
    }
}
