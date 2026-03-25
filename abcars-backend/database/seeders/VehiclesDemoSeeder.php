<?php

namespace Database\Seeders;

use App\Models\BrandLine;
use App\Models\Dealership;
use App\Models\LineModel;
use App\Models\Vehicle;
use App\Models\VehicleBrand;
use Illuminate\Database\Seeder;

class VehiclesDemoSeeder extends Seeder
{
    /**
     * Crea marcas, líneas, modelos y vehículos de prueba para desarrollo.
     */
    public function run(): void
    {
        // 1. Marcas
        $brands = [
            ['name' => 'Toyota'],
            ['name' => 'Honda'],
            ['name' => 'Chevrolet'],
            ['name' => 'Nissan'],
            ['name' => 'Ford'],
        ];

        foreach ($brands as $data) {
            VehicleBrand::firstOrCreate(['name' => $data['name']], $data);
        }

        // 2. Líneas por marca
        $lines = [
            ['brand' => 'Toyota', 'name' => 'Camry'],
            ['brand' => 'Toyota', 'name' => 'Corolla'],
            ['brand' => 'Honda', 'name' => 'Civic'],
            ['brand' => 'Honda', 'name' => 'Accord'],
            ['brand' => 'Chevrolet', 'name' => 'Silverado'],
            ['brand' => 'Chevrolet', 'name' => 'Onix'],
            ['brand' => 'Nissan', 'name' => 'Versa'],
            ['brand' => 'Nissan', 'name' => 'Sentra'],
            ['brand' => 'Ford', 'name' => 'Ranger'],
            ['brand' => 'Ford', 'name' => 'Focus'],
        ];

        foreach ($lines as $data) {
            $brand = VehicleBrand::where('name', $data['brand'])->first();
            if ($brand) {
                BrandLine::firstOrCreate(
                    ['brand_id' => $brand->id, 'name' => $data['name']],
                    ['brand_id' => $brand->id, 'name' => $data['name']]
                );
            }
        }

        // 3. Modelos por línea
        $models = [
            ['brand' => 'Toyota', 'line' => 'Camry', 'name' => 'Camry LE', 'year' => 2023],
            ['brand' => 'Toyota', 'line' => 'Camry', 'name' => 'Camry SE', 'year' => 2022],
            ['brand' => 'Toyota', 'line' => 'Corolla', 'name' => 'Corolla XEi', 'year' => 2023],
            ['brand' => 'Honda', 'line' => 'Civic', 'name' => 'Civic LX', 'year' => 2023],
            ['brand' => 'Honda', 'line' => 'Accord', 'name' => 'Accord Sport', 'year' => 2022],
            ['brand' => 'Chevrolet', 'line' => 'Onix', 'name' => 'Onix Turbo', 'year' => 2023],
            ['brand' => 'Nissan', 'line' => 'Versa', 'name' => 'Versa S', 'year' => 2023],
            ['brand' => 'Nissan', 'line' => 'Sentra', 'name' => 'Sentra SV', 'year' => 2022],
            ['brand' => 'Ford', 'line' => 'Ranger', 'name' => 'Ranger XLT', 'year' => 2022],
        ];

        foreach ($models as $data) {
            $brand = VehicleBrand::where('name', $data['brand'])->first();
            $line = $brand ? BrandLine::where('brand_id', $brand->id)->where('name', $data['line'])->first() : null;
            if ($brand && $line) {
                LineModel::firstOrCreate(
                    [
                        'line_id' => $line->id,
                        'brand_id' => $brand->id,
                        'name' => $data['name'],
                        'year' => $data['year'],
                    ],
                    [
                        'line_id' => $line->id,
                        'brand_id' => $brand->id,
                        'name' => $data['name'],
                        'year' => $data['year'],
                    ]
                );
            }
        }

        // 4. Vehículos (necesitamos al menos DealershipsSeeder ejecutado)
        $dealerships = Dealership::all();
        if ($dealerships->isEmpty()) {
            echo "No hay concesionarios. Ejecuta primero DealershipsSeeder.\n";
            return;
        }

        $vehiclesData = [
            ['brand' => 'Toyota', 'line' => 'Camry', 'model' => 'Camry LE', 'year' => 2023, 'name' => 'Toyota Camry LE 2023', 'sale_price' => 520000, 'mileage' => 15000],
            ['brand' => 'Toyota', 'line' => 'Camry', 'model' => 'Camry SE', 'year' => 2022, 'name' => 'Toyota Camry SE 2022', 'sale_price' => 465000, 'mileage' => 28000],
            ['brand' => 'Toyota', 'line' => 'Corolla', 'model' => 'Corolla XEi', 'year' => 2023, 'name' => 'Toyota Corolla XEi 2023', 'sale_price' => 385000, 'mileage' => 12000],
            ['brand' => 'Honda', 'line' => 'Civic', 'model' => 'Civic LX', 'year' => 2023, 'name' => 'Honda Civic LX 2023', 'sale_price' => 398000, 'mileage' => 18000],
            ['brand' => 'Honda', 'line' => 'Accord', 'model' => 'Accord Sport', 'year' => 2022, 'name' => 'Honda Accord Sport 2022', 'sale_price' => 485000, 'mileage' => 22000],
            ['brand' => 'Chevrolet', 'line' => 'Onix', 'model' => 'Onix Turbo', 'year' => 2023, 'name' => 'Chevrolet Onix Turbo 2023', 'sale_price' => 315000, 'mileage' => 8000],
            ['brand' => 'Nissan', 'line' => 'Versa', 'model' => 'Versa S', 'year' => 2023, 'name' => 'Nissan Versa S 2023', 'sale_price' => 295000, 'mileage' => 14000],
            ['brand' => 'Nissan', 'line' => 'Sentra', 'model' => 'Sentra SV', 'year' => 2022, 'name' => 'Nissan Sentra SV 2022', 'sale_price' => 365000, 'mileage' => 32000],
            ['brand' => 'Ford', 'line' => 'Ranger', 'model' => 'Ranger XLT', 'year' => 2022, 'name' => 'Ford Ranger XLT 2022', 'sale_price' => 585000, 'mileage' => 25000],
            ['brand' => 'Toyota', 'line' => 'Camry', 'model' => 'Camry LE', 'year' => 2023, 'name' => 'Toyota Camry LE 2023 Gris', 'sale_price' => 508000, 'mileage' => 19000],
        ];

        foreach ($vehiclesData as $data) {
            $brand = VehicleBrand::where('name', $data['brand'])->first();
            $line = $brand ? BrandLine::where('brand_id', $brand->id)->where('name', $data['line'])->first() : null;
            $model = $line
                ? LineModel::where('line_id', $line->id)->where('name', $data['model'])->where('year', $data['year'])->first()
                : null;

            if (! $brand || ! $line || ! $model) {
                continue;
            }

            $existing = Vehicle::where('name', $data['name'])->exists();
            if (! $existing) {
                Vehicle::create([
                    'name' => $data['name'],
                    'description' => 'Vehículo seminuevo en excelentes condiciones.',
                    'vin' => strtoupper(bin2hex(random_bytes(8))),
                    'sale_price' => $data['sale_price'],
                    'list_price' => $data['sale_price'] * 1.05,
                    'mileage' => $data['mileage'],
                    'type' => 'car',
                    'category' => 'pre_owned',
                    'transmission' => 'automatic',
                    'fuel_type' => 'gasoline',
                    'interior_color' => 'Negro',
                    'exterior_color' => 'Blanco',
                    'page_status' => 'active',
                    'brand_id' => $brand->id,
                    'line_id' => $line->id,
                    'model_id' => $model->id,
                    'dealership_id' => $dealerships->random()->id,
                ]);
            }
        }

        $count = Vehicle::count();
        echo "VehiclesDemoSeeder: {$count} vehículos disponibles.\n";
    }
}
