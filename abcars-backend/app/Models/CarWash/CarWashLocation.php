<?php

namespace App\Models\CarWash;

use App\Models\Dealership;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CarWashLocation extends CarWashModel
{
    protected $fillable = [
        'name', 'code', 'dealership_id', 'phone', 'address', 'is_active', 'open_hours',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'open_hours' => 'array',
    ];

    protected $hidden = ['id', 'deleted_at'];

    protected function tableSuffix(): string
    {
        return 'carwash_locations';
    }

    public function dealership(): BelongsTo
    {
        return $this->belongsTo(Dealership::class, 'dealership_id');
    }

    public function bays(): HasMany
    {
        return $this->hasMany(CarWashBay::class, 'location_id');
    }

    public function washers(): HasMany
    {
        return $this->hasMany(CarWashWasher::class, 'location_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(CarWashAppointment::class, 'location_id');
    }
}
