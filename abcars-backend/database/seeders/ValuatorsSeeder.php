<?php

namespace Database\Seeders;

use Database\Seeders\Support\SeededUser;
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

        $this->seedValuator($role, 'cesar_fuentes@abcars.mx', 'cesar_fuentes', 'CesarFuentes%2024%%', 'Cesar', 'Fuentes');
        $this->seedValuator($role, 'fabian_tapia@abcars.mx', 'fabian_tapia', 'FabianTapia%2024%%', 'Fabian', 'Tapia');

    }

    private function seedValuator($role, string $email, string $nickname, string $password, string $name, string $lastName): void
    {
        $user = SeededUser::findExistingOrCreate([
            'email' => $email,
            'nickname' => $nickname,
            'password' => $password,
        ]);
        if (! $user->hasRole('valuator')) {
            $user->assignRole($role);
        }
        if (! $user->userProfile) {
            $user->userProfile()->create([
                'name' => $name,
                'last_name' => $lastName,
            ]);
        }
    }
}
