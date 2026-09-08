<?php

namespace App\Models\CarWash;

class CarWashCustomer extends CarWashModel
{
    protected $fillable = [
        'customer_phone',
        'customer_name',
        'last_service_type_id',
        'last_service_name',
        'last_service_code',
        'last_location_id',
        'last_location_name',
        'last_vehicle_plates',
        'last_vehicle_brand',
        'last_vehicle_model',
        'last_appointment_id',
        'last_delivered_at',
        'visits_count',
        'last_rebook_offer_at',
        'rebook_offers_count',
        'meta',
    ];

    protected $casts = [
        'last_delivered_at' => 'datetime',
        'last_rebook_offer_at' => 'datetime',
        'visits_count' => 'integer',
        'rebook_offers_count' => 'integer',
        'meta' => 'array',
    ];

    protected $hidden = ['id', 'deleted_at'];

    protected function tableSuffix(): string
    {
        return 'carwash_customers';
    }
}
