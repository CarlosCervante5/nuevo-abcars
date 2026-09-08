<?php

namespace App\Models\CarWash;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarWashBay extends CarWashModel
{
    protected $fillable = [
        'location_id', 'name', 'code', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $hidden = ['id', 'deleted_at'];

    protected function tableSuffix(): string
    {
        return 'carwash_bays';
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(CarWashLocation::class, 'location_id');
    }
}
