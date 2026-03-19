<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class ValuatorsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::findByName('valuator');

        // Usuarios demo (idempotente: redeploys no duplican nickname/email)
        $user = User::firstOrCreate(
            ['email' => 'cesar_fuentes@abcars.mx'],
            ['nickname' => 'cesar_fuentes', 'password' => 'CesarFuentes%2024%%']
        );
        if ($user->wasRecentlyCreated) {
            $user->assignRole($role);
            $user->userProfile()->create([
                'name' => 'Cesar',
                'last_name' => 'Fuentes',
            ]);
        } else {
            if (! $user->hasRole('valuator')) {
                $user->assignRole($role);
            }
            if (! $user->userProfile) {
                $user->userProfile()->create([
                    'name' => 'Cesar',
                    'last_name' => 'Fuentes',
                ]);
            }
        }

        $user = User::firstOrCreate(
            ['email' => 'fabian_tapia@abcars.mx'],
            ['nickname' => 'fabian_tapia', 'password' => 'FabianTapia%2024%%']
        );
        if ($user->wasRecentlyCreated) {
            $user->assignRole($role);
            $user->userProfile()->create([
                'name' => 'Fabian',
                'last_name' => 'Tapia',
            ]);
        } else {
            if (! $user->hasRole('valuator')) {
                $user->assignRole($role);
            }
            if (! $user->userProfile) {
                $user->userProfile()->create([
                    'name' => 'Fabian',
                    'last_name' => 'Tapia',
                ]);
            }
        }

    }
}
