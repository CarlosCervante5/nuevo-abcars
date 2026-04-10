<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class BodyworkTechnicianSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::firstOrCreate(['name' => 'bodywork_paint_technician']);

        $user = User::firstOrCreate(
            ['email' => 'bodywork_technician@abcars.mx'],
            ['nickname' => 'bodywork_technician', 'password' => 'BodyworkTechnician%2024%%']
        );

        if (! $user->hasRole('bodywork_paint_technician')) {
            $user->assignRole($role);
        }

        if (! $user->userProfile) {
            $user->userProfile()->create([
                'name' => 'Técnico',
                'last_name' => 'Hojalatería y pintura',
            ]);
        }
    }
}
