<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class IntellimotorsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::findByName('manager');

        $user = User::factory()->create([
            'nickname' => 'intellimotors_manager',
            'email' => 'intellimotors@abcars.mx',
            'password' => '4}K8Rpvq*Z-9'
        ]);
        
        $user->assignRole($role);

    }
}
