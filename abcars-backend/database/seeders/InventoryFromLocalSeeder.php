<?php

namespace Database\Seeders;

use App\Models\Dealership;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;

class InventoryFromLocalSeeder extends Seeder
{
    /**
     * Seed del inventario completo exportado desde local.
     * Incluye: dealerships, brands, models, versions, bodies, vehicles e images.
     * Sucursales: solo las 6 reales del home (mismo criterio que DealershipsSeeder).
     */
    public function run(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');
        $now = now()->format('Y-m-d H:i:s');

        $this->purgeNonCanonicalDealerships();

        // ── 1. Dealerships (las 6 oficiales; actualiza texto/dirección si ya existían) ──
        $dealerships = [
            [
                'name' => 'ventas matriz',
                'location' => 'puebla',
                'description' => 'VENTAS MATRIZ',
                'address' => "Blvrd Esteban de Antuñano 1314\nObrera Textil José Abascal\n72130 Puebla, Pue.",
            ],
            [
                'name' => 'ventas serdan',
                'location' => 'puebla',
                'description' => 'VENTAS SERDAN',
                'address' => "Boulevard Hermanos Serdán 241\nAmpliación Aquiles Serdán\nPuebla, Pue.",
            ],
            [
                'name' => 'ventas sucursal tlaxcala',
                'location' => 'zacatelco',
                'description' => 'VENTAS SUCURSAL TLAXCALA',
                'address' => "Carr. Federal Puebla - Tlaxcala Km 18.5\nBarrio de Guardia\n90740 Zacatelco, Tlax.",
            ],
            [
                'name' => 'service body paint',
                'location' => 'puebla',
                'description' => 'SERVICE, BODY & PAINT',
                'address' => "Av. 31 Pte. 4110 Ampliación Reforma Sur\nC.P. 72160, Puebla, Pue.",
            ],
            [
                'name' => 'ventas sucursal hidalgo',
                'location' => 'pachuca',
                'description' => 'VENTAS SUCURSAL HIDALGO',
                'address' => "Vial, La Paz 113, Adolfo López Mateos\n42094 Pachuca de Soto, Hgo.",
            ],
            [
                'name' => 'ventas sucursal cholula',
                'location' => 'puebla',
                'description' => 'VENTAS SUCURSAL CHOLULA',
                'address' => "Lateral Norte Recta a Cholula no. 1408 San Andres Choula\n72819 Puebla, Pue.",
            ],
        ];

        $dealershipIds = [];
        foreach ($dealerships as $d) {
            $existing = DB::table($prefix . 'dealerships')
                ->where('name', $d['name'])
                ->whereNull('deleted_at')
                ->first();
            if ($existing) {
                DB::table($prefix . 'dealerships')->where('id', $existing->id)->update([
                    'location' => $d['location'],
                    'description' => $d['description'],
                    'address' => $d['address'],
                    'updated_at' => $now,
                ]);
                $dealershipIds[$d['name']] = $existing->id;
            } else {
                $id = DB::table($prefix . 'dealerships')->insertGetId(array_merge($d, [
                    'created_at' => $now, 'updated_at' => $now,
                ]));
                $dealershipIds[$d['name']] = $id;
            }
        }
        echo "Dealerships: " . count($dealershipIds) . "\n";

        // ── 2. Brands (40 marcas, solo las primeras 40 únicas) ──
        $brandNames = [
            'chevrolet','ford','toyota','honda','nissan','volkswagen','hyundai','kia',
            'mazda','bmw','mercedes-benz','audi','mitsubishi','suzuki','subaru','jeep',
            'dodge','fiat','renault','peugeot','seat','skoda','volvo','lexus','acura',
            'infiniti','cadillac','buick','gmc','lincoln','mini','smart','dacia','lada',
            'great wall','byd','chery','geely','mg','jac',
        ];

        $brandIds = [];
        foreach ($brandNames as $name) {
            $existing = DB::table($prefix . 'vehicle_brands')
                ->where('name', $name)->whereNull('deleted_at')->first();
            if ($existing) {
                $brandIds[$name] = $existing->id;
            } else {
                $id = DB::table($prefix . 'vehicle_brands')->insertGetId([
                    'name' => $name, 'created_at' => $now, 'updated_at' => $now,
                ]);
                $brandIds[$name] = $id;
            }
        }
        echo "Brands: " . count($brandIds) . "\n";

        // ── 3. Bodies ──
        $bodyNames = ['suv', 'sedan'];
        $bodyIds = [];
        foreach ($bodyNames as $name) {
            $existing = DB::table($prefix . 'vehicle_bodies')
                ->where('name', $name)->whereNull('deleted_at')->first();
            if ($existing) {
                $bodyIds[$name] = $existing->id;
            } else {
                $id = DB::table($prefix . 'vehicle_bodies')->insertGetId([
                    'name' => $name, 'created_at' => $now, 'updated_at' => $now,
                ]);
                $bodyIds[$name] = $id;
            }
        }

        // ── 4. Models + Versions ──
        $modelsData = [
            ['name' => 'trax',      'year' => 2020, 'brand' => 'chevrolet',  'version' => '1.8 premier piel at',           'body' => 'suv'],
            ['name' => 'x5',        'year' => 2022, 'brand' => 'bmw',        'version' => '4.4 m competition at',           'body' => 'suv'],
            ['name' => 'civic',     'year' => 2019, 'brand' => 'honda',      'version' => '1.5 turbo plus sedan piel cvt',  'body' => 'sedan'],
            ['name' => 'sentra',    'year' => 2021, 'brand' => 'nissan',     'version' => '1.8 advance cvt',                'body' => 'sedan'],
            ['name' => 'corolla',   'year' => 2020, 'brand' => 'toyota',     'version' => '1.8 le cvt',                     'body' => 'sedan'],
            ['name' => 'escape',    'year' => 2022, 'brand' => 'ford',       'version' => '2.0 titanium ecoboost at',       'body' => 'suv'],
            ['name' => 'elantra',   'year' => 2019, 'brand' => 'hyundai',    'version' => '2.0 gls premium at',             'body' => 'sedan'],
            ['name' => 'cx-5',      'year' => 2021, 'brand' => 'mazda',      'version' => '2.5 grand touring at',           'body' => 'suv'],
            ['name' => 'jetta',     'year' => 2020, 'brand' => 'volkswagen', 'version' => '1.4 comfortline tsi tiptronic',  'body' => 'sedan'],
            ['name' => 'sportage',  'year' => 2022, 'brand' => 'kia',        'version' => '2.0 ex pack at',                 'body' => 'suv'],
            ['name' => 'accord',    'year' => 2021, 'brand' => 'honda',      'version' => '1.5 sport turbo cvt',            'body' => 'sedan'],
            ['name' => 'equinox',   'year' => 2020, 'brand' => 'chevrolet',  'version' => '1.5 premier plus turbo at',      'body' => 'suv'],
            ['name' => 'outlander', 'year' => 2021, 'brand' => 'mitsubishi', 'version' => '2.4 es cvt',                     'body' => 'suv'],
        ];

        $modelIds = [];
        $versionIds = [];
        foreach ($modelsData as $md) {
            $brandId = $brandIds[$md['brand']];
            $key = $md['brand'] . '_' . $md['name'] . '_' . $md['year'];

            $existing = DB::table($prefix . 'line_models')
                ->where('name', $md['name'])->where('year', $md['year'])->where('brand_id', $brandId)
                ->whereNull('deleted_at')->first();
            if ($existing) {
                $modelIds[$key] = $existing->id;
            } else {
                $modelIds[$key] = DB::table($prefix . 'line_models')->insertGetId([
                    'name' => $md['name'], 'year' => $md['year'], 'brand_id' => $brandId,
                    'created_at' => $now, 'updated_at' => $now,
                ]);
            }

            $existingV = DB::table($prefix . 'model_versions')
                ->where('name', $md['version'])->where('model_id', $modelIds[$key])
                ->whereNull('deleted_at')->first();
            if ($existingV) {
                $versionIds[$key] = $existingV->id;
            } else {
                $versionIds[$key] = DB::table($prefix . 'model_versions')->insertGetId([
                    'name' => $md['version'], 'model_id' => $modelIds[$key],
                    'created_at' => $now, 'updated_at' => $now,
                ]);
            }
        }
        echo "Models: " . count($modelIds) . ", Versions: " . count($versionIds) . "\n";

        // ── 5. Vehicles ──
        $vehicles = [
            [
                'uuid' => 'fb087dc8-402d-497e-bcf4-009f28e70867',
                'name' => 'Chevrolet Trax 2020 1.8 Premier Piel At',
                'description' => '¡Adquiere un seminuevo certificado ya mismo! Servicios de mantenimiento realizados en distribuidor GM por especialistas certificados. Unidades verificadas por revisión de 100 puntos de calidad. Documentación 100% verificada.',
                'list_price' => 300000, 'offer_price' => null, 'mileage' => 63626,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'cylinders' => 4,
                'interior_color' => 'negro', 'exterior_color' => 'rojo', 'category' => 'pre_owned',
                'type' => 'car', 'model_key' => 'chevrolet_trax_2020', 'dealership' => 'ventas matriz', 'body' => 'suv',
                'image' => 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1000&q=80',
            ],
            [
                'uuid' => '159cd4bf-70be-4d9e-988e-3e60534ff5c3',
                'name' => 'BMW X5 2022 4.4 M Competition At',
                'description' => 'BMW X5 2022 4.4 M Competition At. Compra con Calidad. Aprovecha la Garantía. Aplica nuestros planes de financiamiento.',
                'list_price' => 1850000, 'offer_price' => null, 'mileage' => 36035,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'cylinders' => 8,
                'interior_color' => 'naranja', 'exterior_color' => 'azul', 'category' => 'pre_owned',
                'type' => 'car', 'model_key' => 'bmw_x5_2022', 'dealership' => 'ventas sucursal hidalgo', 'body' => 'suv',
                'image' => 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80',
            ],
            [
                'uuid' => 'dc0cc65d-08a1-4491-9036-aff27be71f37',
                'name' => 'Honda Civic 2019 1.5 Turbo Plus Sedan Piel Cvt',
                'description' => '¡Adquiere un seminuevo ya mismo! Un año de garantía. Unidades verificadas por revisión de 100 puntos de calidad.',
                'list_price' => 340000, 'offer_price' => 330000, 'mileage' => 134925,
                'transmission' => 'cvt', 'fuel_type' => 'gasoline', 'cylinders' => 4,
                'interior_color' => 'negro', 'exterior_color' => 'rojo', 'category' => 'pre_owned',
                'type' => 'car', 'model_key' => 'honda_civic_2019', 'dealership' => 'ventas matriz', 'body' => 'sedan',
                'image' => 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80',
            ],
            [
                'uuid' => 'ba19c6b8-359d-457a-95cd-7a73a133841f',
                'name' => 'Nissan Sentra 2021 1.8 Advance Cvt',
                'description' => 'Nissan Sentra en excelente estado. Mantenimientos al corriente. Garantía extendida disponible.',
                'list_price' => 280000, 'offer_price' => null, 'mileage' => 45000,
                'transmission' => 'cvt', 'fuel_type' => 'gasoline', 'cylinders' => 4,
                'interior_color' => 'negro', 'exterior_color' => 'blanco', 'category' => 'pre_owned',
                'type' => 'car', 'model_key' => 'nissan_sentra_2021', 'dealership' => 'ventas matriz', 'body' => 'sedan',
                'image' => 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1000&q=80',
            ],
            [
                'uuid' => '6ae28f8b-bc26-4d03-84a1-3e5e8807b478',
                'name' => 'Toyota Corolla 2020 1.8 Le Cvt',
                'description' => 'Toyota Corolla confiable y económico. Perfecto para uso diario. Precio especial esta semana.',
                'list_price' => 320000, 'offer_price' => 310000, 'mileage' => 52000,
                'transmission' => 'cvt', 'fuel_type' => 'gasoline', 'cylinders' => 4,
                'interior_color' => 'negro', 'exterior_color' => 'gris', 'category' => 'pre_owned',
                'type' => 'car', 'model_key' => 'toyota_corolla_2020', 'dealership' => 'ventas matriz', 'body' => 'sedan',
                'image' => 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=80',
            ],
            [
                'uuid' => 'c6337804-2cc9-4b62-9e5f-e7656441a195',
                'name' => 'Ford Escape 2022 2.0 Titanium Ecoboost At',
                'description' => 'Ford Escape Titanium con todas las comodidades. Tecnología avanzada y gran espacio interior.',
                'list_price' => 520000, 'offer_price' => null, 'mileage' => 28000,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'cylinders' => 4,
                'interior_color' => 'beige', 'exterior_color' => 'azul', 'category' => 'pre_owned',
                'type' => 'car', 'model_key' => 'ford_escape_2022', 'dealership' => 'ventas sucursal hidalgo', 'body' => 'suv',
                'image' => 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80',
            ],
            [
                'uuid' => '171a9c04-39b1-40d6-9c15-25c09f4d9533',
                'name' => 'Hyundai Elantra 2019 2.0 Gls Premium At',
                'description' => 'Hyundai Elantra con excelente rendimiento de combustible. Ideal para ciudad y carretera.',
                'list_price' => 240000, 'offer_price' => null, 'mileage' => 78000,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'cylinders' => 4,
                'interior_color' => 'negro', 'exterior_color' => 'rojo', 'category' => 'pre_owned',
                'type' => 'car', 'model_key' => 'hyundai_elantra_2019', 'dealership' => 'ventas matriz', 'body' => 'sedan',
                'image' => 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1000&q=80',
            ],
            [
                'uuid' => 'b3f57308-788b-4033-b92e-b8f880347cf9',
                'name' => 'Mazda CX-5 2021 2.5 Grand Touring At',
                'description' => 'Mazda CX-5 con diseño elegante y tecnología Skyactiv. SUV premium con gran desempeño.',
                'list_price' => 450000, 'offer_price' => null, 'mileage' => 35000,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'cylinders' => 4,
                'interior_color' => 'rojo', 'exterior_color' => 'negro', 'category' => 'pre_owned',
                'type' => 'car', 'model_key' => 'mazda_cx-5_2021', 'dealership' => 'ventas matriz', 'body' => 'suv',
                'image' => 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1000&q=80',
            ],
            [
                'uuid' => '80f0f7da-0ec2-47e6-970d-44bd4b2275b3',
                'name' => 'Volkswagen Jetta 2020 1.4 Comfortline Tsi Tiptronic',
                'description' => 'Volkswagen Jetta con ingeniería alemana. Económico y confiable para uso diario.',
                'list_price' => 290000, 'offer_price' => 285000, 'mileage' => 61000,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'cylinders' => 4,
                'interior_color' => 'negro', 'exterior_color' => 'blanco', 'category' => 'pre_owned',
                'type' => 'car', 'model_key' => 'volkswagen_jetta_2020', 'dealership' => 'ventas sucursal hidalgo', 'body' => 'sedan',
                'image' => 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80',
            ],
            [
                'uuid' => '8715f63f-a6cd-4280-af5d-6b2a1770c705',
                'name' => 'Kia Sportage 2022 2.0 EX Pack At',
                'description' => 'Kia Sportage con garantía extendida. SUV familiar con gran espacio y comodidad.',
                'list_price' => 390000, 'offer_price' => null, 'mileage' => 25000,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'cylinders' => 4,
                'interior_color' => 'negro', 'exterior_color' => 'gris', 'category' => 'pre_owned',
                'type' => 'car', 'model_key' => 'kia_sportage_2022', 'dealership' => 'ventas matriz', 'body' => 'suv',
                'image' => 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1000&q=80',
            ],
            [
                'uuid' => '3b0c3458-f732-4003-b78e-f9be4c74decb',
                'name' => 'Honda Accord 2021 1.5 Sport Turbo Cvt',
                'description' => 'Honda Accord Sport con motor turbo. Sedán deportivo con excelente desempeño y tecnología.',
                'list_price' => 420000, 'offer_price' => null, 'mileage' => 40000,
                'transmission' => 'cvt', 'fuel_type' => 'gasoline', 'cylinders' => 4,
                'interior_color' => 'beige', 'exterior_color' => 'azul', 'category' => 'pre_owned',
                'type' => 'car', 'model_key' => 'honda_accord_2021', 'dealership' => 'ventas matriz', 'body' => 'sedan',
                'image' => 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80',
            ],
            [
                'uuid' => 'ae6327a9-9881-47b8-b03d-c609176055fb',
                'name' => 'Chevrolet Equinox 2020 1.5 Premier Plus Turbo At',
                'description' => 'Chevrolet Equinox Premier con todas las comodidades. SUV familiar con gran tecnología.',
                'list_price' => 380000, 'offer_price' => null, 'mileage' => 55000,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'cylinders' => 4,
                'interior_color' => 'negro', 'exterior_color' => 'blanco', 'category' => 'pre_owned',
                'type' => 'car', 'model_key' => 'chevrolet_equinox_2020', 'dealership' => 'ventas sucursal hidalgo', 'body' => 'suv',
                'image' => 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1000&q=80',
            ],
            [
                'uuid' => 'e582005c-3352-405c-bf7f-2df3acdf2610',
                'name' => 'Mitsubishi Outlander 2021 2.4 Es Cvt',
                'description' => 'Mitsubishi Outlander con 7 asientos. Perfecta para familias grandes. Precio especial.',
                'list_price' => 350000, 'offer_price' => 340000, 'mileage' => 42000,
                'transmission' => 'cvt', 'fuel_type' => 'gasoline', 'cylinders' => 4,
                'interior_color' => 'gris', 'exterior_color' => 'negro', 'category' => 'pre_owned',
                'type' => 'car', 'model_key' => 'mitsubishi_outlander_2021', 'dealership' => 'ventas matriz', 'body' => 'suv',
                'image' => 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80',
            ],
        ];

        $vehicleCount = 0;
        foreach ($vehicles as $v) {
            $existing = DB::table($prefix . 'vehicles')
                ->where('uuid', $v['uuid'])->whereNull('deleted_at')->first();
            if ($existing) {
                continue;
            }

            $modelId = $modelIds[$v['model_key']] ?? null;
            $versionId = $versionIds[$v['model_key']] ?? null;
            $dealershipId = $dealershipIds[$v['dealership']] ?? null;
            $bodyId = $bodyIds[$v['body']] ?? null;
            $brandKey = explode('_', $v['model_key'])[0];
            $brandId = $brandIds[$brandKey] ?? null;

            if (!$modelId || !$dealershipId || !$brandId) {
                echo "SKIP: {$v['name']} (missing refs)\n";
                continue;
            }

            $vehicleId = DB::table($prefix . 'vehicles')->insertGetId([
                'uuid'           => $v['uuid'],
                'name'           => $v['name'],
                'description'    => $v['description'],
                'vin'            => strtoupper(bin2hex(random_bytes(8))),
                'sale_price'     => $v['list_price'],
                'list_price'     => $v['list_price'],
                'offer_price'    => $v['offer_price'],
                'mileage'        => $v['mileage'],
                'type'           => $v['type'],
                'category'       => $v['category'],
                'cylinders'      => $v['cylinders'],
                'interior_color' => $v['interior_color'],
                'exterior_color' => $v['exterior_color'],
                'transmission'   => $v['transmission'],
                'fuel_type'      => $v['fuel_type'],
                'page_status'    => 'active',
                'brand_id'       => $brandId,
                'model_id'       => $modelId,
                'version_id'     => $versionId,
                'body_id'        => $bodyId,
                'dealership_id'  => $dealershipId,
                'created_at'     => $now,
                'updated_at'     => $now,
            ]);

            // Insert image
            DB::table($prefix . 'vehicle_images')->insert([
                'uuid'               => (string) Uuid::uuid4(),
                'sort_id'            => 1,
                'image_name'         => strtolower(str_replace(' ', '-', $v['name'])) . '.jpg',
                'service_public_id'  => 'seed_' . $vehicleId . '_' . time(),
                'service_image_url'  => $v['image'],
                'vehicle_id'         => $vehicleId,
                'created_at'         => $now,
                'updated_at'         => $now,
            ]);

            $vehicleCount++;
        }

        echo "InventoryFromLocalSeeder: {$vehicleCount} vehículos creados.\n";
    }

    /**
     * Elimina sucursales que no son las 6 del sitio (ej. demo cdmx, querétaro, vecsa).
     */
    private function purgeNonCanonicalDealerships(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');
        $allowed = [
            'ventas matriz',
            'ventas serdan',
            'ventas sucursal tlaxcala',
            'service body paint',
            'ventas sucursal hidalgo',
            'ventas sucursal cholula',
        ];

        foreach (Dealership::withTrashed()->get() as $d) {
            $n = mb_strtolower(trim((string) $d->name), 'UTF-8');
            if (in_array($n, $allowed, true)) {
                continue;
            }
            DB::table($prefix . 'vehicles')->where('dealership_id', $d->id)->update(['dealership_id' => null]);
            DB::table($prefix . 'vehicle_valuations')->where('dealership_id', $d->id)->update(['dealership_id' => null]);
            $d->forceDelete();
        }
    }
}
