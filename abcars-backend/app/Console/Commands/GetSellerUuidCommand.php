<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class GetSellerUuidCommand extends Command
{
    protected $signature = 'referral:get-seller-uuid {--email= : Email del seller a buscar}';
    protected $description = 'Obtiene el UUID de un vendedor (seller) para usar en links de referidos';

    public function handle(): int
    {
        $email = $this->option('email');

        $query = User::role('seller');

        if ($email) {
            $query->where('email', $email);
        }

        $sellers = $query->get();

        if ($sellers->isEmpty()) {
            $this->error('No se encontraron vendedores (sellers) en el sistema.');
            $this->line('Ejecuta: php artisan db:seed --class=ChevroletSellersSeeder');
            return 1;
        }

        $this->info('UUIDs de vendedores para links de referidos:');
        $this->newLine();

        foreach ($sellers as $seller) {
            $profile = $seller->userProfile;
            $name = $profile ? trim($profile->name . ' ' . $profile->last_name) : $seller->nickname;
            $this->line("  {$seller->uuid}  ({$name} - {$seller->email})");
        }

        $this->newLine();
        $this->line('Ejemplo de uso en pruebas:');
        $this->line('  ./test-referral-requests.sh ' . $sellers->first()->uuid);
        $this->newLine();
        $this->line('Link de inventario con referido:');
        $this->line('  ' . (config('app.frontend_url') ?: 'http://localhost:4200') . '/inventario?ref=' . $sellers->first()->uuid);

        return 0;
    }
}
