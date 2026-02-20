<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Permisos (idempotente: firstOrCreate para poder re-ejecutar el seeder)
        Permission::firstOrCreate(['name' => 'create vehicles']);
        Permission::firstOrCreate(['name' => 'update vehicles']);
        Permission::firstOrCreate(['name' => 'delete vehicles']);
        Permission::firstOrCreate(['name' => 'list all vehicles']);
        Permission::firstOrCreate(['name' => 'list users']);
        Permission::firstOrCreate(['name' => 'create users']);
        Permission::firstOrCreate(['name' => 'update users']);
        Permission::firstOrCreate(['name' => 'delete users']);

        // Roles (idempotente)
        $role1 = Role::firstOrCreate(['name' => 'manager']);
        $role1->givePermissionTo(['create vehicles', 'update vehicles', 'delete vehicles']);

        $role2 = Role::firstOrCreate(['name' => 'administrator']);
        $role2->givePermissionTo(['list users', 'create users', 'update users', 'delete users']);

        Role::firstOrCreate(['name' => 'client']);

        $role4 = Role::firstOrCreate(['name' => 'gestor']);
        $role4->givePermissionTo('list all vehicles');

        $role5 = Role::firstOrCreate(['name' => 'marketing']);
        $role6 = Role::firstOrCreate(['name' => 'staff']);
        Role::firstOrCreate(['name' => 'valuator']);
        Role::firstOrCreate(['name' => 'technician']);
        Role::firstOrCreate(['name' => 'seller']);
        Role::firstOrCreate(['name' => 'bodywork_paint_technician']);
        Role::firstOrCreate(['name' => 'spare_parts']);
        Role::firstOrCreate(['name' => 'strega-seller']);
        Role::firstOrCreate(['name' => 'strega-manager']);
        Role::firstOrCreate(['name' => 'strega-administrator']);
        Role::firstOrCreate(['name' => 'appointment_manager']);

        // Usuarios demo (solo si no existen, para que manager/admin/gestor/staff entren tras re-deploys)
        $user = User::firstOrCreate(
            ['email' => 'manager@abcars.mx'],
            ['nickname' => 'manager', 'password' => 'Manager%2024%%']
        );
        if ($user->wasRecentlyCreated) {
            $user->assignRole($role5);
            $user->userProfile()->create(['name' => 'Manager', 'last_name' => 'Vecsa']);
        }

        $user = User::firstOrCreate(
            ['email' => 'admin@abcars.mx'],
            ['nickname' => 'administrador', 'password' => 'Administrator%2024%%']
        );
        if ($user->wasRecentlyCreated) {
            $user->assignRole($role2);
            $user->userProfile()->create(['name' => 'Admin', 'last_name' => 'ABCars']);
        }

        $user = User::firstOrCreate(
            ['email' => 'gestor@abcars.mx'],
            ['nickname' => 'gestor', 'password' => 'Gestor%2024%%']
        );
        if ($user->wasRecentlyCreated) {
            $user->assignRole($role4);
            $user->userProfile()->create(['name' => 'Gestor', 'last_name' => 'ABCars']);
        }

        $user = User::firstOrCreate(
            ['email' => 'staff@abcars.mx'],
            ['nickname' => 'staff', 'password' => 'Staff%2024%%']
        );
        if ($user->wasRecentlyCreated) {
            $user->assignRole($role6);
            $user->userProfile()->create(['name' => 'Staff', 'last_name' => 'ABCars']);
        }
    }
}
