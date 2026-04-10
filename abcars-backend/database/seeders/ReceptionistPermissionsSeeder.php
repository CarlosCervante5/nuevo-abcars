<?php

namespace Database\Seeders;

use App\Models\User;
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

        $user = User::firstOrCreate(
            ['email' => 'ivonne@abcars.mx'],
            ['nickname' => 'Ivonne_Recepcion', 'password' => 'IvonneSalinas%2024%%']
        );
        $user->assignRole($role6);
        if ($user->wasRecentlyCreated) {
            $user->userProfile()->create([
                'name' => 'Ivonne',
                'last_name' => 'Salinas',
            ]);
        }

        $user = User::firstOrCreate(
            ['email' => 'valeria@abcars.mx'],
            ['nickname' => 'Valeria.Recepcion', 'password' => 'ValeriaGalicia%2024%%']
        );
        $user->assignRole($role6);
        if ($user->wasRecentlyCreated) {
            $user->userProfile()->create([
                'name' => 'Valeria',
                'last_name' => 'Galicia',
            ]);
        }

    }
}
