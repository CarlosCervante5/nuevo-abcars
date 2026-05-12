<?php

namespace Database\Seeders;

use Database\Seeders\Support\SeededUser;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class BodySeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        Permission::firstOrCreate(['name' => 'view body hyp standalone orders']);
        Permission::firstOrCreate(['name' => 'create body hyp standalone orders']);

        $role = Role::firstOrCreate(['name' => 'body']);
        $role->syncPermissions([
            'view body hyp standalone orders',
            'create body hyp standalone orders',
        ]);

        $user = SeededUser::findExistingOrCreate([
            'email' => 'body@abcars.mx',
            'nickname' => 'body',
            'password' => 'Body%2024%%',
        ]);

        if (! $user->hasRole('body')) {
            $user->assignRole($role);
        }

        if (! $user->userProfile) {
            $user->userProfile()->create([
                'name' => 'Body',
                'last_name' => 'HyP',
            ]);
        }
    }
}
