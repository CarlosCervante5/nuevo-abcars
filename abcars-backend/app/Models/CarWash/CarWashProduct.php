<?php

namespace App\Models\CarWash;

class CarWashProduct extends CarWashModel
{
    protected $fillable = [
        'name', 'sku', 'description', 'price', 'stock', 'is_active', 'image_path',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $hidden = ['id', 'deleted_at'];

    protected function tableSuffix(): string
    {
        return 'carwash_products';
    }
}
