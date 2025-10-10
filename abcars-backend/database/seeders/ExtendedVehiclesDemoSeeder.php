<?php

namespace Database\Seeders;

use App\Models\Dealership;
use App\Models\Vehicle;
use App\Models\VehicleBrand;
use App\Services\VehicleService;
use App\Services\UserService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ExtendedVehiclesDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear instancia del VehicleService
        $userService = new UserService();
        $vehicleService = new VehicleService($userService);
        
        // ID de usuario del sistema
        $systemUserId = 1;

        // Array expandido con más vehículos de prueba
        $vehicles = [
            [
                'name' => 'Nissan Sentra 2021 1.8 Advance Cvt',
                'brand' => 'nissan',
                'model' => 'sentra',
                'version' => '1.8 advance cvt',
                'body' => 'sedan',
                'year' => 2021,
                'dealership_name' => 'abcars puebla',
                'location' => 'puebla, méxico',
                'sale_price' => 280000,
                'list_price' => 280000,
                'mileage' => 45000,
                'exterior_color' => 'blanco',
                'interior_color' => 'negro',
                'transmission' => 'cvt',
                'fuel_type' => 'gasoline',
                'type' => 'car',
                'category' => 'pre_owned',
                'cylinders' => 4,
                'page_status' => 'active',
                'vin' => '3N1AB5S31FL123456',
                'description' => 'Nissan Sentra en excelente estado. Mantenimientos al corriente. Garantía extendida disponible.'
            ],
            [
                'name' => 'Toyota Corolla 2020 1.8 Le Cvt',
                'brand' => 'toyota',
                'model' => 'corolla',
                'version' => '1.8 le cvt',
                'body' => 'sedan',
                'year' => 2020,
                'dealership_name' => 'abcars cdmx',
                'location' => 'ciudad de méxico',
                'sale_price' => 320000,
                'list_price' => 320000,
                'offer_price' => 310000,
                'mileage' => 52000,
                'exterior_color' => 'gris',
                'interior_color' => 'negro',
                'transmission' => 'cvt',
                'fuel_type' => 'gasoline',
                'type' => 'car',
                'category' => 'pre_owned',
                'cylinders' => 4,
                'page_status' => 'sale',
                'vin' => '2T1BU4EE0LC123789',
                'description' => 'Toyota Corolla confiable y económico. Perfecto para uso diario. Precio especial esta semana.'
            ],
            [
                'name' => 'Ford Escape 2022 2.0 Titanium Ecoboost At',
                'brand' => 'ford',
                'model' => 'escape',
                'version' => '2.0 titanium ecoboost at',
                'body' => 'suv',
                'year' => 2022,
                'dealership_name' => 'abcars hidalgo',
                'location' => 'hidalgo, méxico',
                'sale_price' => 520000,
                'list_price' => 520000,
                'mileage' => 28000,
                'exterior_color' => 'azul',
                'interior_color' => 'beige',
                'transmission' => 'automatic',
                'fuel_type' => 'gasoline',
                'type' => 'car',
                'category' => 'pre_owned',
                'cylinders' => 4,
                'page_status' => 'active',
                'vin' => '1FMCU9HD2NUA12345',
                'description' => 'Ford Escape Titanium con todas las comodidades. Tecnología avanzada y gran espacio interior.'
            ],
            [
                'name' => 'Hyundai Elantra 2019 2.0 Gls Premium At',
                'brand' => 'hyundai',
                'model' => 'elantra',
                'version' => '2.0 gls premium at',
                'body' => 'sedan',
                'year' => 2019,
                'dealership_name' => 'abcars puebla',
                'location' => 'puebla, méxico',
                'sale_price' => 240000,
                'list_price' => 240000,
                'mileage' => 78000,
                'exterior_color' => 'rojo',
                'interior_color' => 'negro',
                'transmission' => 'automatic',
                'fuel_type' => 'gasoline',
                'type' => 'car',
                'category' => 'pre_owned',
                'cylinders' => 4,
                'page_status' => 'active',
                'vin' => 'KMHL14JA5KA123456',
                'description' => 'Hyundai Elantra con excelente rendimiento de combustible. Ideal para ciudad y carretera.'
            ],
            [
                'name' => 'Mazda CX-5 2021 2.5 Grand Touring At',
                'brand' => 'mazda',
                'model' => 'cx-5',
                'version' => '2.5 grand touring at',
                'body' => 'suv',
                'year' => 2021,
                'dealership_name' => 'abcars cdmx',
                'location' => 'ciudad de méxico',
                'sale_price' => 450000,
                'list_price' => 450000,
                'mileage' => 35000,
                'exterior_color' => 'negro',
                'interior_color' => 'rojo',
                'transmission' => 'automatic',
                'fuel_type' => 'gasoline',
                'type' => 'car',
                'category' => 'pre_owned',
                'cylinders' => 4,
                'page_status' => 'active',
                'vin' => 'JM3KFBDL5M0123456',
                'description' => 'Mazda CX-5 con diseño elegante y tecnología Skyactiv. SUV premium con gran desempeño.'
            ],
            [
                'name' => 'Volkswagen Jetta 2020 1.4 Comfortline Tsi Tiptronic',
                'brand' => 'volkswagen',
                'model' => 'jetta',
                'version' => '1.4 comfortline tsi tiptronic',
                'body' => 'sedan',
                'year' => 2020,
                'dealership_name' => 'abcars hidalgo',
                'location' => 'hidalgo, méxico',
                'sale_price' => 290000,
                'list_price' => 290000,
                'offer_price' => 285000,
                'mileage' => 61000,
                'exterior_color' => 'blanco',
                'interior_color' => 'negro',
                'transmission' => 'automatic',
                'fuel_type' => 'gasoline',
                'type' => 'car',
                'category' => 'pre_owned',
                'cylinders' => 4,
                'page_status' => 'sale',
                'vin' => '3VW2B7AJ4LM123456',
                'description' => 'Volkswagen Jetta con ingeniería alemana. Económico y confiable para uso diario.'
            ],
            [
                'name' => 'Kia Sportage 2022 2.0 EX Pack At',
                'brand' => 'kia',
                'model' => 'sportage',
                'version' => '2.0 ex pack at',
                'body' => 'suv',
                'year' => 2022,
                'dealership_name' => 'abcars cdmx',
                'location' => 'ciudad de méxico',
                'sale_price' => 390000,
                'list_price' => 390000,
                'mileage' => 25000,
                'exterior_color' => 'gris',
                'interior_color' => 'negro',
                'transmission' => 'automatic',
                'fuel_type' => 'gasoline',
                'type' => 'car',
                'category' => 'pre_owned',
                'cylinders' => 4,
                'page_status' => 'active',
                'vin' => 'KNDPM3AC2N7123456',
                'description' => 'Kia Sportage con garantía extendida. SUV familiar con gran espacio y comodidad.'
            ],
            [
                'name' => 'Honda Accord 2021 1.5 Sport Turbo Cvt',
                'brand' => 'honda',
                'model' => 'accord',
                'version' => '1.5 sport turbo cvt',
                'body' => 'sedan',
                'year' => 2021,
                'dealership_name' => 'abcars puebla',
                'location' => 'puebla, méxico',
                'sale_price' => 420000,
                'list_price' => 420000,
                'mileage' => 40000,
                'exterior_color' => 'azul',
                'interior_color' => 'beige',
                'transmission' => 'cvt',
                'fuel_type' => 'gasoline',
                'type' => 'car',
                'category' => 'pre_owned',
                'cylinders' => 4,
                'page_status' => 'active',
                'vin' => '1HGCV1F32MA123456',
                'description' => 'Honda Accord Sport con motor turbo. Sedán deportivo con excelente desempeño y tecnología.'
            ],
            [
                'name' => 'Chevrolet Equinox 2020 1.5 Premier Plus Turbo At',
                'brand' => 'chevrolet',
                'model' => 'equinox',
                'version' => '1.5 premier plus turbo at',
                'body' => 'suv',
                'year' => 2020,
                'dealership_name' => 'abcars hidalgo',
                'location' => 'hidalgo, méxico',
                'sale_price' => 380000,
                'list_price' => 380000,
                'mileage' => 55000,
                'exterior_color' => 'blanco',
                'interior_color' => 'negro',
                'transmission' => 'automatic',
                'fuel_type' => 'gasoline',
                'type' => 'car',
                'category' => 'pre_owned',
                'cylinders' => 4,
                'page_status' => 'active',
                'vin' => '2GNAXSEV2L6123456',
                'description' => 'Chevrolet Equinox Premier con todas las comodidades. SUV familiar con gran tecnología.'
            ],
            [
                'name' => 'Mitsubishi Outlander 2021 2.4 Es Cvt',
                'brand' => 'mitsubishi',
                'model' => 'outlander',
                'version' => '2.4 es cvt',
                'body' => 'suv',
                'year' => 2021,
                'dealership_name' => 'abcars cdmx',
                'location' => 'ciudad de méxico',
                'sale_price' => 350000,
                'list_price' => 350000,
                'offer_price' => 340000,
                'mileage' => 42000,
                'exterior_color' => 'negro',
                'interior_color' => 'gris',
                'transmission' => 'cvt',
                'fuel_type' => 'gasoline',
                'type' => 'car',
                'category' => 'pre_owned',
                'cylinders' => 4,
                'page_status' => 'sale',
                'vin' => 'JA4J3VA89MZ123456',
                'description' => 'Mitsubishi Outlander con 7 asientos. Perfecta para familias grandes. Precio especial.'
            ]
        ];

        echo "Agregando " . count($vehicles) . " vehículos adicionales...\n";

        foreach ($vehicles as $vehicleData) {
            try {
                $vehicleService->createVehicle($vehicleData, $systemUserId);
                echo "✅ Vehículo creado: {$vehicleData['name']}\n";
            } catch (\Exception $e) {
                echo "❌ Error creando vehículo {$vehicleData['name']}: " . $e->getMessage() . "\n";
            }
        }

        echo "\n🎉 Proceso completado! Total de vehículos ahora: " . Vehicle::count() . "\n";
    }
} 