<?php

namespace App\Models\CarWash;

class CarWashServiceType extends CarWashModel
{
    protected $fillable = [
        'name', 'code', 'description', 'duration_minutes', 'price', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'duration_minutes' => 'integer',
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $hidden = ['id', 'deleted_at'];

    protected function tableSuffix(): string
    {
        return 'carwash_service_types';
    }
}
