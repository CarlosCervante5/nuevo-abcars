<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerAppointment;
use App\Models\CustomerVehicle;
use App\Models\Dealership;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Valuations\VehicleValuation;
use App\Models\Valuations\ValuationCheckpoint;
use App\Models\Valuations\AcquisitionCheckpoint;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ValuationsDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener vehículos existentes
        $vehicles = Vehicle::limit(10)->get();
        
        if ($vehicles->isEmpty()) {
            echo "No hay vehículos disponibles. Ejecuta primero VehiclesDemoSeeder.\n";
            return;
        }

        // Obtener concesionarios existentes
        $dealerships = Dealership::all();
        
        if ($dealerships->isEmpty()) {
            echo "No hay concesionarios disponibles. Ejecuta primero VehiclesDemoSeeder.\n";
            return;
        }

        // Obtener usuarios valuadores
        $valuators = User::whereHas('roles', function ($query) {
            $query->where('name', 'valuator');
        })->get();

        // Obtener usuarios vendedores
        $sellers = User::whereHas('roles', function ($query) {
            $query->where('name', 'seller');
        })->get();

        // Obtener usuarios técnicos
        $technicians = User::whereHas('roles', function ($query) {
            $query->where('name', 'technician');
        })->get();

        // Si no hay usuarios, usar los de prueba
        if ($valuators->isEmpty()) {
            $valuator = User::where('email', 'valuador@abcars.mx')->first();
            if ($valuator) {
                $valuators = collect([$valuator]);
            }
        }

        if ($sellers->isEmpty()) {
            $seller = User::where('email', 'vendedor@abcars.mx')->first();
            if ($seller) {
                $sellers = collect([$seller]);
            }
        }

        if ($technicians->isEmpty()) {
            $technician = User::where('email', 'tecnico@abcars.mx')->first();
            if ($technician) {
                $technicians = collect([$technician]);
            }
        }

        // Crear clientes de ejemplo si no existen
        $customers = $this->createDemoCustomers();

        // Crear valuaciones de ejemplo con diferentes estados
        $valuations = [
            [
                'status' => 'to_appraise',
                'status_repairs' => 'pending_entry',
                'status_parts' => 'pending_entry',
                'status_acquisition' => 'to_acquire',
                'book_trade_in_offer' => 250000,
                'book_sale_price' => 280000,
                'intellimotors_trade_in_offer' => 240000,
                'intellimotors_sale_price' => 275000,
                'comments' => 'Vehículo en buen estado general. Requiere revisión completa de mecánica y eléctrica.',
            ],
            [
                'status' => 'on_progress',
                'status_repairs' => 'pending_review',
                'status_parts' => 'pending_entry',
                'status_acquisition' => 'to_acquire',
                'book_trade_in_offer' => 320000,
                'book_sale_price' => 360000,
                'intellimotors_trade_in_offer' => 310000,
                'intellimotors_sale_price' => 350000,
                'labor_cost' => 15000,
                'spare_parts_cost' => 8000,
                'body_work_painting_cost' => 12000,
                'estimated_total' => 35000,
                'comments' => 'Valuación en progreso. Se han identificado reparaciones necesarias en el sistema de frenos y pintura.',
            ],
            [
                'status' => 'appraised',
                'status_repairs' => 'repairs_done',
                'status_parts' => 'parts_done',
                'status_acquisition' => 'acquisition_ready',
                'book_trade_in_offer' => 180000,
                'book_sale_price' => 220000,
                'intellimotors_trade_in_offer' => 175000,
                'intellimotors_sale_price' => 215000,
                'labor_cost' => 8500,
                'spare_parts_cost' => 4500,
                'body_work_painting_cost' => 6000,
                'estimated_total' => 19000,
                'trade_in_final' => 175000,
                'final_offer' => 195000,
                'comments' => 'Valuación completada. Todas las reparaciones y refacciones han sido evaluadas. Listo para adquisición.',
            ],
            [
                'status' => 'on_hold',
                'status_repairs' => 'pending_review',
                'status_parts' => 'pending_review',
                'status_acquisition' => 'to_acquire',
                'book_trade_in_offer' => 420000,
                'book_sale_price' => 480000,
                'intellimotors_trade_in_offer' => 410000,
                'intellimotors_sale_price' => 470000,
                'labor_cost' => 25000,
                'spare_parts_cost' => 15000,
                'body_work_painting_cost' => 20000,
                'estimated_total' => 60000,
                'comments' => 'Valuación en espera. Se requiere autorización del cliente para proceder con las reparaciones identificadas.',
            ],
            [
                'status' => 'acquired',
                'status_repairs' => 'repairs_done',
                'status_parts' => 'parts_done',
                'status_acquisition' => 'acquisition_ready',
                'book_trade_in_offer' => 290000,
                'book_sale_price' => 330000,
                'intellimotors_trade_in_offer' => 285000,
                'intellimotors_sale_price' => 325000,
                'labor_cost' => 12000,
                'spare_parts_cost' => 7000,
                'body_work_painting_cost' => 9000,
                'estimated_total' => 28000,
                'trade_in_final' => 285000,
                'final_offer' => 310000,
                'comments' => 'Vehículo adquirido exitosamente. Todas las reparaciones completadas y documentación lista.',
            ],
            [
                'status' => 'to_appraise',
                'status_repairs' => 'pending_entry',
                'status_parts' => 'pending_entry',
                'status_acquisition' => 'to_acquire',
                'book_trade_in_offer' => 150000,
                'book_sale_price' => 180000,
                'intellimotors_trade_in_offer' => 145000,
                'intellimotors_sale_price' => 175000,
                'comments' => 'Nueva valuación pendiente. Vehículo con alto kilometraje, requiere evaluación detallada.',
            ],
            [
                'status' => 'on_progress',
                'status_repairs' => 'pending_entry',
                'status_parts' => 'pending_review',
                'status_acquisition' => 'to_acquire',
                'book_trade_in_offer' => 380000,
                'book_sale_price' => 420000,
                'intellimotors_trade_in_offer' => 370000,
                'intellimotors_sale_price' => 410000,
                'spare_parts_cost' => 18000,
                'comments' => 'Evaluación de refacciones en revisión. Se requiere cotización de piezas originales.',
            ],
            [
                'status' => 'appraised',
                'status_repairs' => 'repairs_done',
                'status_parts' => 'pending_review',
                'status_acquisition' => 'to_acquire',
                'book_trade_in_offer' => 220000,
                'book_sale_price' => 260000,
                'intellimotors_trade_in_offer' => 215000,
                'intellimotors_sale_price' => 255000,
                'labor_cost' => 10000,
                'body_work_painting_cost' => 8000,
                'estimated_total' => 18000,
                'trade_in_final' => 215000,
                'final_offer' => 230000,
                'comments' => 'Valuación completada. Reparaciones evaluadas. Pendiente revisión final de refacciones.',
            ],
        ];

        $tablePrefix = env('DB_TABLE_PREFIX', '');

        foreach ($valuations as $index => $valuationData) {
            // Seleccionar vehículo aleatorio
            $vehicle = $vehicles->random();
            
            // Seleccionar concesionario aleatorio
            $dealership = $dealerships->random();
            
            // Seleccionar cliente aleatorio
            $customer = $customers->random();

            // Crear vehículo del cliente
            $customerVehicle = CustomerVehicle::firstOrCreate([
                'customer_id' => $customer->id,
                'brand_name' => $vehicle->brand->name ?? 'Toyota',
                'model_name' => $vehicle->model->name ?? 'Corolla',
                'year' => $vehicle->year ?? 2020,
                'mileage' => rand(10000, 100000),
            ], [
                'name' => ($vehicle->brand->name ?? 'Toyota') . ' ' . ($vehicle->model->name ?? 'Corolla'),
                'vin' => 'VIN' . str_pad($index + 1, 17, '0', STR_PAD_LEFT),
                'exterior_color' => ['Blanco', 'Negro', 'Gris', 'Rojo', 'Azul'][array_rand(['Blanco', 'Negro', 'Gris', 'Rojo', 'Azul'])],
                'transmission' => ['manual', 'automatic'][array_rand(['manual', 'automatic'])],
            ]);

            // Crear cita (appointment) para la valuación
            $appointment = CustomerAppointment::create([
                'type' => 'valuation',
                'customer_id' => $customer->id,
                'vehicle_id' => $customerVehicle->id,
                'dealership_name' => $dealership->name,
                'scheduled_date' => now()->addDays(rand(1, 30))->format('Y-m-d H:i:s'),
                'status' => 'scheduled',
            ]);

            // Crear la valuación asociada a la cita
            $valuation = VehicleValuation::create([
                'appointment_id' => $appointment->id,
                'vehicle_id' => $vehicle->id,
                'dealership_id' => $dealership->id,
                'status' => $valuationData['status'],
                'status_repairs' => $valuationData['status_repairs'],
                'status_parts' => $valuationData['status_parts'],
                'status_acquisition' => $valuationData['status_acquisition'],
                'book_trade_in_offer' => $valuationData['book_trade_in_offer'],
                'book_sale_price' => $valuationData['book_sale_price'],
                'intellimotors_trade_in_offer' => $valuationData['intellimotors_trade_in_offer'],
                'intellimotors_sale_price' => $valuationData['intellimotors_sale_price'],
                'labor_cost' => $valuationData['labor_cost'] ?? null,
                'spare_parts_cost' => $valuationData['spare_parts_cost'] ?? null,
                'body_work_painting_cost' => $valuationData['body_work_painting_cost'] ?? null,
                'estimated_total' => $valuationData['estimated_total'] ?? null,
                'trade_in_final' => $valuationData['trade_in_final'] ?? null,
                'final_offer' => $valuationData['final_offer'] ?? null,
                'comments' => $valuationData['comments'],
            ]);

            // Asociar valuador si existe
            if ($valuators->isNotEmpty()) {
                $valuator = $valuators->random();
                DB::table($tablePrefix . 'user_valuation')->insert([
                    'valuation_id' => $valuation->id,
                    'user_id' => $valuator->id,
                    'user_role_name' => 'valuator',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Asociar vendedor si existe
            if ($sellers->isNotEmpty()) {
                $seller = $sellers->random();
                DB::table($tablePrefix . 'user_valuation')->insert([
                    'valuation_id' => $valuation->id,
                    'user_id' => $seller->id,
                    'user_role_name' => 'seller',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Asociar técnico si existe y la valuación está en progreso o completada
            if ($technicians->isNotEmpty() && in_array($valuation->status, ['on_progress', 'appraised', 'acquired'])) {
                $technician = $technicians->random();
                DB::table($tablePrefix . 'user_valuation')->insert([
                    'valuation_id' => $valuation->id,
                    'user_id' => $technician->id,
                    'user_role_name' => 'technician',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Asociar checkpoints de valuación (similar a ValuationService)
            $valuation_checkpoints_ids = [
                1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,
                21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,
                41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,
                61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,
                81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,
                101,102,103,104,105,106,107,108,109,110,111,112,113,114,115
            ];
            
            $checkpoints = ValuationCheckpoint::whereIn('id', $valuation_checkpoints_ids)->get();
            if ($checkpoints->isNotEmpty()) {
                $valuation->checkpoints()->attach($checkpoints);
            }

            // Asociar checkpoints de adquisición
            $acquisition_checkpoints_ids = [
                1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,
                21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,
                41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,
                61,62,63,64,65,66,67,68,69
            ];
            
            $acquisition_checkpoints = AcquisitionCheckpoint::whereIn('id', $acquisition_checkpoints_ids)->get();
            if ($acquisition_checkpoints->isNotEmpty()) {
                $valuation->acquisition_checkpoints()->attach($acquisition_checkpoints);
            }

            echo "Valuación creada: ID {$valuation->id} - Estado: {$valuation->status} - Vehículo: {$vehicle->name} - Appointment ID: {$appointment->id} - Checkpoints asociados\n";
        }

        echo "\n✅ Se crearon " . count($valuations) . " valuaciones de ejemplo con sus appointments asociados.\n";
    }

    /**
     * Crear clientes de ejemplo
     */
    private function createDemoCustomers()
    {
        $customersData = [
            ['name' => 'Juan', 'last_name' => 'Pérez', 'email_1' => 'juan.perez@example.com', 'phone_1' => '5551234567'],
            ['name' => 'María', 'last_name' => 'González', 'email_1' => 'maria.gonzalez@example.com', 'phone_1' => '5552345678'],
            ['name' => 'Carlos', 'last_name' => 'Rodríguez', 'email_1' => 'carlos.rodriguez@example.com', 'phone_1' => '5553456789'],
            ['name' => 'Ana', 'last_name' => 'Martínez', 'email_1' => 'ana.martinez@example.com', 'phone_1' => '5554567890'],
            ['name' => 'Luis', 'last_name' => 'López', 'email_1' => 'luis.lopez@example.com', 'phone_1' => '5555678901'],
            ['name' => 'Laura', 'last_name' => 'Hernández', 'email_1' => 'laura.hernandez@example.com', 'phone_1' => '5556789012'],
            ['name' => 'Roberto', 'last_name' => 'García', 'email_1' => 'roberto.garcia@example.com', 'phone_1' => '5557890123'],
            ['name' => 'Patricia', 'last_name' => 'Sánchez', 'email_1' => 'patricia.sanchez@example.com', 'phone_1' => '5558901234'],
        ];

        $customers = collect();

        foreach ($customersData as $customerData) {
            $customer = Customer::firstOrCreate(
                ['email_1' => $customerData['email_1']],
                array_merge($customerData, [
                    'gender' => 'm',
                    'contact_method' => 'phone',
                ])
            );
            $customers->push($customer);
        }

        return $customers;
    }
}

