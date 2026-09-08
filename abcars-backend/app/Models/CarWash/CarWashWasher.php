<?php

namespace App\Models\CarWash;

use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarWashWasher extends CarWashModel
{
    protected $fillable = [
        'user_id', 'location_id', 'display_name', 'phone', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $hidden = ['id', 'deleted_at'];

    protected function tableSuffix(): string
    {
        return 'carwash_washers';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(CarWashLocation::class, 'location_id');
    }
}
