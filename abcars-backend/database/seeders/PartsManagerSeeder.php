<?php

namespace Database\Seeders;

use Database\Seeders\Support\SeededUser;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PartsManagerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::findByName('spare_parts');

        $user = SeededUser::findExistingOrCreate([
            'email' => 'spare_parts@abcars.mx',
            'nickname' => 'spare_parts',
            'password' => 'SpareParts%2024%%',
        ]);
        if (! $user->hasRole('spare_parts')) {
            $user->assignRole($role);
        }
    }
}
