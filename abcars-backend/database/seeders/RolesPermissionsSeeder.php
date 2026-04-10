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

        // Contenido público / home
        Permission::firstOrCreate(['name' => 'manage main banner']);
        Permission::firstOrCreate(['name' => 'manage delivery photos']);
        // Formularios del sitio, métricas y tablero admin (solicitudes / envíos)
        Permission::firstOrCreate(['name' => 'view analytics dashboard']);
        // CRM Strega (oportunidades / leads internos)
        Permission::firstOrCreate(['name' => 'view opportunities']);
        Permission::firstOrCreate(['name' => 'manage opportunities']);

        // Roles (idempotente)
        $role1 = Role::firstOrCreate(['name' => 'manager']);
        $role1->givePermissionTo(['create vehicles', 'update vehicles', 'delete vehicles']);

        $role2 = Role::firstOrCreate(['name' => 'administrator']);

        Role::firstOrCreate(['name' => 'client']);

        $role4 = Role::firstOrCreate(['name' => 'gestor']);
        $role4->givePermissionTo(['list all vehicles', 'manage delivery photos']);

        $role5 = Role::firstOrCreate(['name' => 'marketing']);
        $role5->givePermissionTo(['manage main banner']);
        $role6 = Role::firstOrCreate(['name' => 'staff']);
        Role::firstOrCreate(['name' => 'valuator']);
        Role::firstOrCreate(['name' => 'technician']);
        Role::firstOrCreate(['name' => 'seller']);
        Role::firstOrCreate(['name' => 'bodywork_paint_technician']);
        Role::firstOrCreate(['name' => 'spare_parts']);
        Role::firstOrCreate(['name' => 'strega-seller']);
        Role::firstOrCreate(['name' => 'strega-manager']);
        Role::firstOrCreate(['name' => 'strega-administrator']);
        $roleAppointment = Role::firstOrCreate(['name' => 'appointment_manager']);
        $roleAppointment->givePermissionTo(['view analytics dashboard']);

        Role::firstOrCreate(['name' => 'valuation_manager']);

        foreach (['strega-seller', 'strega-manager', 'strega-administrator'] as $stregaRoleName) {
            $stregaRole = Role::firstOrCreate(['name' => $stregaRoleName]);
            $stregaRole->givePermissionTo(['view opportunities', 'manage opportunities']);
        }

        // Administrator y super_admin: todos los permisos registrados (gestión completa del panel)
        $allPermissions = Permission::all()->pluck('name')->toArray();
        $roleSuperAdmin = Role::firstOrCreate(['name' => 'super_admin']);
        if (!empty($allPermissions)) {
            $role2->syncPermissions($allPermissions);
            $roleSuperAdmin->syncPermissions($allPermissions);
        }

        // Usuarios demo (solo si no existen, para que manager/admin/gestor/staff entren tras re-deploys)
        $user = User::firstOrCreate(
            ['email' => 'manager@abcars.mx'],
            ['nickname' => 'manager', 'password' => 'Manager%2024%%']
        );
        if ($user->wasRecentlyCreated) {
            $user->assignRole($role1);
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

        // Usuario Super Admin (control total del sistema)
        $userSuperAdmin = User::firstOrCreate(
            ['email' => 'superadmin@abcars.mx'],
            ['nickname' => 'super_admin', 'password' => 'SuperAdmin%2024%%']
        );
        if ($userSuperAdmin->wasRecentlyCreated) {
            $userSuperAdmin->assignRole($roleSuperAdmin);
            $userSuperAdmin->userProfile()->create(['name' => 'Super', 'last_name' => 'Admin']);
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

        // Usuario de prueba: valuator (app de valuación)
        $roleValuator = Role::findByName('valuator');
        $user = User::firstOrCreate(
            ['email' => 'valuator@abcars.mx'],
            ['nickname' => 'valuator', 'password' => 'Valuator%2024%%']
        );
        if ($user->wasRecentlyCreated) {
            $user->assignRole($roleValuator);
            $user->userProfile()->create(['name' => 'Valuator', 'last_name' => 'Prueba']);
        }

        // Usuario de prueba: vendedor
        $roleSeller = Role::findByName('seller');
        $user = User::firstOrCreate(
            ['email' => 'vendedor@abcars.mx'],
            ['nickname' => 'vendedor', 'password' => 'Vendedor123']
        );
        if ($user->wasRecentlyCreated) {
            $user->assignRole($roleSeller);
            $user->userProfile()->create(['name' => 'Vendedor', 'last_name' => 'Prueba']);
        }
    }
}
