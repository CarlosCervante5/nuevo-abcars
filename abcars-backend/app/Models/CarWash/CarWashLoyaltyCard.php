<?php

namespace App\Models\CarWash;

use Illuminate\Database\Eloquent\Relations\HasMany;

class CarWashLoyaltyCard extends CarWashModel
{
    protected $fillable = [
        'customer_phone',
        'customer_name',
        'stamps_count',
        'completed_cycles',
        'last_stamp_at',
        'reward_ready_at',
    ];

    protected $casts = [
        'stamps_count' => 'integer',
        'completed_cycles' => 'integer',
        'last_stamp_at' => 'datetime',
        'reward_ready_at' => 'datetime',
    ];

    protected $hidden = ['id', 'deleted_at'];

    protected function tableSuffix(): string
    {
        return 'carwash_loyalty_cards';
    }

    public function stamps(): HasMany
    {
        return $this->hasMany(CarWashLoyaltyStamp::class, 'loyalty_card_id');
    }
}
