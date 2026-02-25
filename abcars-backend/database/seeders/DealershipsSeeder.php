<?php

namespace Database\Seeders;

use App\Models\Dealership;
use Illuminate\Database\Seeder;

class DealershipsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Crea sucursales de prueba para el sistema.
     */
    public function run(): void
    {
        $sucursales = [
            [
                'name' => 'vecsa hidalgo',
                'location' => 'pachuca',
                'description' => 'Sucursal principal en Pachuca, Hidalgo',
            ],
            [
                'name' => 'vecsa pachuca',
                'location' => 'pachuca',
                'description' => 'Sucursal Pachuca centro',
            ],
            [
                'name' => 'abcars cdmx',
                'location' => 'ciudad de méxico',
                'description' => 'Sucursal en Ciudad de México',
            ],
            [
                'name' => 'abcars querétaro',
                'location' => 'querétaro',
                'description' => 'Sucursal en Querétaro',
            ],
            [
                'name' => 'abcars puebla',
                'location' => 'puebla',
                'description' => 'Sucursal en Puebla',
            ],
            [
                'name' => 'abcars toluca',
                'location' => 'toluca',
                'description' => 'Sucursal en Toluca, Estado de México',
            ],
        ];

        foreach ($sucursales as $sucursal) {
            Dealership::firstOrCreate(
                [
                    'name' => $sucursal['name'],
                    'location' => $sucursal['location'],
                ],
                [
                    'description' => $sucursal['description'],
                ]
            );
        }
    }
}
