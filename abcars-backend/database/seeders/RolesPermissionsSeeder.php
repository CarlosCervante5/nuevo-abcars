<?php

namespace Database\Seeders;

use App\Models\Dealership;
use Database\Seeders\Support\SeededUser;
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

        $branchDefault = Dealership::query()->orderBy('id')->first();

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

        // HyP independientes (rol body)
        Permission::firstOrCreate(['name' => 'view body hyp standalone orders']);
        Permission::firstOrCreate(['name' => 'create body hyp standalone orders']);

        // Roles (idempotente)
        $roleBody = Role::firstOrCreate(['name' => 'body']);
        $roleBody->syncPermissions([
            'view body hyp standalone orders',
            'create body hyp standalone orders',
        ]);

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

        // Usuarios demo: no duplican si ya existen (email o nickname en BD actual)
        $user = SeededUser::findExistingOrCreate([
            'email' => 'manager@abcars.mx',
            'nickname' => 'manager',
            'password' => 'Manager%2024%%',
        ]);
        if (! $user->hasRole('manager')) {
            $user->assignRole($role1);
        }
        if (! $user->userProfile) {
            $user->userProfile()->create(['name' => 'Manager', 'last_name' => 'Vecsa']);
        }

        $user = SeededUser::findExistingOrCreate([
            'email' => 'admin@abcars.mx',
            'nickname' => 'administrador',
            'password' => 'Administrator%2024%%',
        ]);
        if (! $user->hasRole('administrator')) {
            $user->assignRole($role2);
        }
        if (! $user->userProfile) {
            $user->userProfile()->create(['name' => 'Admin', 'last_name' => 'ABCars']);
        }

        $userSuperAdmin = SeededUser::findExistingOrCreate([
            'email' => 'superadmin@abcars.mx',
            'nickname' => 'super_admin',
            'password' => 'SuperAdmin%2024%%',
        ]);
        if (! $userSuperAdmin->hasRole('super_admin')) {
            $userSuperAdmin->assignRole($roleSuperAdmin);
        }
        if (! $userSuperAdmin->userProfile) {
            $userSuperAdmin->userProfile()->create(['name' => 'Super', 'last_name' => 'Admin']);
        }

        $user = SeededUser::findExistingOrCreate([
            'email' => 'gestor@abcars.mx',
            'nickname' => 'gestor',
            'password' => 'Gestor%2024%%',
        ]);
        if (! $user->hasRole('gestor')) {
            $user->assignRole($role4);
        }
        if (! $user->userProfile) {
            $user->userProfile()->create(['name' => 'Gestor', 'last_name' => 'ABCars']);
        }

        $user = SeededUser::findExistingOrCreate([
            'email' => 'staff@abcars.mx',
            'nickname' => 'staff',
            'password' => 'Staff%2024%%',
        ]);
        if (! $user->hasRole('staff')) {
            $user->assignRole($role6);
        }
        if (! $user->userProfile) {
            $user->userProfile()->create(['name' => 'Staff', 'last_name' => 'ABCars']);
        }

        $roleValuator = Role::findByName('valuator');
        $user = SeededUser::findExistingOrCreate([
            'email' => 'valuator@abcars.mx',
            'nickname' => 'valuator',
            'password' => 'Valuator%2024%%',
        ]);
        if (! $user->hasRole('valuator')) {
            $user->assignRole($roleValuator);
        }
        if (! $user->userProfile) {
            $pv = ['name' => 'Valuator', 'last_name' => 'Prueba'];
            if ($branchDefault) {
                $pv['dealership_id'] = $branchDefault->id;
                $pv['location'] = $branchDefault->name;
            }
            $user->userProfile()->create($pv);
        } elseif ($branchDefault && ! $user->userProfile->dealership_id) {
            $user->userProfile->update([
                'dealership_id' => $branchDefault->id,
                'location' => $branchDefault->name,
            ]);
        }

        $roleSeller = Role::findByName('seller');
        $user = SeededUser::findExistingOrCreate([
            'email' => 'vendedor@abcars.mx',
            'nickname' => 'vendedor',
            'password' => 'Vendedor123',
        ]);
        if (! $user->hasRole('seller')) {
            $user->assignRole($roleSeller);
        }
        if (! $user->userProfile) {
            $ps = ['name' => 'Vendedor', 'last_name' => 'Prueba'];
            if ($branchDefault) {
                $ps['dealership_id'] = $branchDefault->id;
                $ps['location'] = $branchDefault->name;
            }
            $user->userProfile()->create($ps);
        } elseif ($branchDefault && ! $user->userProfile->dealership_id) {
            $user->userProfile->update([
                'dealership_id' => $branchDefault->id,
                'location' => $branchDefault->name,
            ]);
        }
    }
}
