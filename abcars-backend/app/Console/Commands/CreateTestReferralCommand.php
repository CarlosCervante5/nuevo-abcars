<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Models\CustomerAppointment;
use App\Models\CustomerVehicle;
use App\Models\User;
use Illuminate\Console\Command;

class CreateTestReferralCommand extends Command
{
    protected $signature = 'referral:create-test 
        {--seller= : UUID del seller (opcional, usa el primero si no se especifica)}
        {--count=1 : Número de solicitudes a crear}';
    protected $description = 'Crea solicitudes de prueba con referido para ver en las vistas del vendedor';

    public function handle(): int
    {
        $sellerUuid = $this->option('seller');
        $count = (int) $this->option('count');

        $seller = $sellerUuid
            ? User::where('uuid', $sellerUuid)->role('seller')->first()
            : User::role('seller')->first();

        if (!$seller) {
            $this->error('No se encontró un vendedor. Ejecuta: php artisan db:seed --class=ChevroletSellersSeeder');
            return 1;
        }

        $this->info("Creando {$count} solicitud(es) de prueba para: {$seller->userProfile?->name} ({$seller->email})");
        $this->newLine();

        for ($i = 0; $i < $count; $i++) {
            $timestamp = now()->format('YmdHis') . '_' . $i;

            $customer = Customer::create([
                'name' => 'Cliente',
                'last_name' => "Referido Test {$timestamp}",
                'email_1' => "test.referido.{$timestamp}@abcars-test.mx",
                'phone_1' => '5512345678',
            ]);

            $mileage = 35000 + ($i * 1000);
            $vehicle = CustomerVehicle::create([
                'mileage' => $mileage,
                'brand_name' => 'Honda',
                'model_name' => 'Civic',
                'year' => 2021,
                'customer_id' => $customer->id,
            ]);

            $scheduledDate = now()->addDays(7)->format('Y-m-d 10:00');

            $appointment = CustomerAppointment::create([
                'type' => 'valuation',
                'scheduled_date' => $scheduledDate,
                'dealership_name' => 'VECSA pachuca',
                'vehicle_id' => $vehicle->id,
                'customer_id' => $customer->id,
                'referrer_user_id' => $seller->id,
            ]);

            $num = $i + 1;
            $this->line("  [{$num}] Cita creada: {$appointment->uuid} - {$customer->name} {$customer->last_name}");
        }

        $this->newLine();
        $this->info('Listo. Inicia sesión como vendedor y ve a: Dashboard > Mis referidos');
        $this->line('  Email: ' . $seller->email);

        return 0;
    }
}
