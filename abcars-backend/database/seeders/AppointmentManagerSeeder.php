<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class AppointmentManagerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::findByName('appointment_manager');

        $user = User::firstOrCreate(
            ['email' => 'corina@abcars.mx'],
            ['nickname' => 'Asigna_Cita_Valuacion', 'password' => 'CorinaEstebanes%2024%%']
        );

        if ($user->wasRecentlyCreated) {
            $user->assignRole($role);
            $user->userProfile()->create([
                'name' => 'Corina',
                'last_name' => 'Estebanes'
            ]);
        } else {
            if (! $user->hasRole('appointment_manager')) {
                $user->assignRole($role);
            }
            if (! $user->userProfile) {
                $user->userProfile()->create([
                    'name' => 'Corina',
                    'last_name' => 'Estebanes'
                ]);
            }
        }
    }
}
