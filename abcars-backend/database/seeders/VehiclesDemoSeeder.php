<?php

namespace Database\Seeders;

use App\Models\Dealership;
use App\Models\Vehicle;
use App\Models\VehicleBrand;
use App\Services\VehicleService;
use App\Services\UserService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class VehiclesDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear concesionarios
        $dealerships = [
            [
                'name' => 'abcars puebla',
                'location' => 'puebla, méxico',
                'description' => 'Concesionario principal en Puebla con amplia gama de vehículos seminuevos y nuevos'
            ],
            [
                'name' => 'abcars hidalgo',
                'location' => 'hidalgo, méxico', 
                'description' => 'Sucursal especializada en vehículos premium y de lujo'
            ],
            [
                'name' => 'abcars cdmx',
                'location' => 'ciudad de méxico',
                'description' => 'Sede principal con la mayor variedad de inventario'
            ]
        ];

        foreach ($dealerships as $dealership) {
            Dealership::firstOrCreate(['name' => $dealership['name']], $dealership);
        }

        // Verificar que existan las marcas necesarias
        $requiredBrands = ['chevrolet', 'bmw', 'honda'];
        foreach ($requiredBrands as $brandName) {
            if (!VehicleBrand::where('name', $brandName)->exists()) {
                echo "Error: Falta la marca '$brandName'. Ejecuta primero VehicleBrandsSeeder.\n";
                return;
            }
        }

        // Crear instancia del VehicleService
        $userService = new UserService();
        $vehicleService = new VehicleService($userService);
        
        // ID de usuario del sistema (puedes usar 1 o crear un usuario específico)
        $systemUserId = 1;

        // Crear vehículos usando el VehicleService que maneja las relaciones automáticamente
        $vehicles = [
            [
                'name' => 'Chevrolet Trax 2020 1.8 Premier Piel At',
                'brand' => 'chevrolet',
                'model' => 'trax',
                'version' => '1.8 premier piel at',
                'body' => 'suv',
                'year' => 2020,
                'dealership_name' => 'abcars puebla',
                'location' => 'puebla, méxico',
                'sale_price' => 300000,
                'list_price' => 300000,
                'mileage' => 63626,
                'exterior_color' => 'rojo',
                'interior_color' => 'negro',
                'transmission' => 'automatic',
                'fuel_type' => 'gasoline',
                'type' => 'car',
                'category' => 'pre_owned',
                'cylinders' => 4,
                'page_status' => 'active',
                'vin' => '3GNCJ7EE9LL260757',
                'description' => '¡Adquiere un seminuevo certificado ya mismo! Servicios de mantenimiento realizados en distribuidor GM por especialistas certificados. Unidades verificadas por revisión de 100 puntos de calidad. Documentación 100% verificada.'
            ],
            [
                'name' => 'BMW X5 2022 4.4 M Competition At',
                'brand' => 'bmw',
                'model' => 'x5',
                'version' => '4.4 m competition at',
                'body' => 'suv',
                'year' => 2022,
                'dealership_name' => 'abcars hidalgo',
                'location' => 'hidalgo, méxico',
                'sale_price' => 1850000,
                'list_price' => 1850000,
                'mileage' => 36035,
                'exterior_color' => 'azul',
                'interior_color' => 'naranja',
                'transmission' => 'automatic',
                'fuel_type' => 'gasoline',
                'type' => 'car',
                'category' => 'pre_owned',
                'cylinders' => 8,
                'page_status' => 'active',
                'vin' => 'WBSJU0103N9H96006',
                'description' => 'BMW X5 2022 4.4 M Competition At. Compra con Calidad. Aprovecha la Garantía. Aplica nuestros planes de financiamiento.'
            ],
            [
                'name' => 'Honda Civic 2019 1.5 Turbo Plus Sedan Piel Cvt',
                'brand' => 'honda',
                'model' => 'civic',
                'version' => '1.5 turbo plus sedan piel cvt',
                'body' => 'sedan',
                'year' => 2019,
                'dealership_name' => 'abcars puebla',
                'location' => 'puebla, méxico',
                'sale_price' => 340000,
                'list_price' => 340000,
                'offer_price' => 330000,
                'mileage' => 134925,
                'exterior_color' => 'rojo',
                'interior_color' => 'negro',
                'transmission' => 'cvt',
                'fuel_type' => 'gasoline',
                'type' => 'car',
                'category' => 'pre_owned',
                'cylinders' => 4,
                'page_status' => 'sale',
                'vin' => '2HGFC327XKH850909',
                'description' => '¡Adquiere un seminuevo ya mismo! Un año de garantía. Unidades verificadas por revisión de 100 puntos de calidad.'
            ]
        ];

        foreach ($vehicles as $vehicleData) {
            try {
                $vehicleService->createVehicle($vehicleData, $systemUserId);
                echo "Vehículo creado: {$vehicleData['name']}\n";
            } catch (\Exception $e) {
                echo "Error creando vehículo {$vehicleData['name']}: " . $e->getMessage() . "\n";
            }
        }
    }
}
