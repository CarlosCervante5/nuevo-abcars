<?php

namespace App\Console\Commands;

use Database\Seeders\CarWashSeeder;
use Illuminate\Console\Command;

class CarWashEnsureStaffCommand extends Command
{
    protected $signature = 'carwash:ensure-staff';

    protected $description = 'Crea/asegura roles, catálogo demo y usuarios supervisor/lavador CarWash';

    public function handle(): int
    {
        $this->call('migrate', [
            '--force' => true,
            '--path' => 'database/migrations/2026_09_08_120000_create_carwash_tables.php',
        ]);

        $this->info('Ejecutando CarWashSeeder…');
        $this->call('db:seed', ['--class' => CarWashSeeder::class, '--force' => true]);

        return self::SUCCESS;
    }
}
