<?php

namespace Database\Seeders;

use Database\Seeders\Support\SeededUser;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class ReceptionistPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $role6 = Role::firstOrCreate(['name' => 'receptionist']);

        $user = SeededUser::findExistingOrCreate([
            'email' => 'ivonne@abcars.mx',
            'nickname' => 'Ivonne_Recepcion',
            'password' => 'IvonneSalinas%2024%%',
        ]);
        if (! $user->hasRole('receptionist')) {
            $user->assignRole($role6);
        }
        if (! $user->userProfile) {
            $user->userProfile()->create([
                'name' => 'Ivonne',
                'last_name' => 'Salinas',
            ]);
        }

        $user = SeededUser::findExistingOrCreate([
            'email' => 'valeria@abcars.mx',
            'nickname' => 'Valeria.Recepcion',
            'password' => 'ValeriaGalicia%2024%%',
        ]);
        if (! $user->hasRole('receptionist')) {
            $user->assignRole($role6);
        }
        if (! $user->userProfile) {
            $user->userProfile()->create([
                'name' => 'Valeria',
                'last_name' => 'Galicia',
            ]);
        }

    }
}
