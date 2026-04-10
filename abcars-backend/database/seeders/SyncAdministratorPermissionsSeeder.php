<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Sincroniza administrator (y super_admin) con todos los permisos existentes en BD.
 * Útil tras crear permisos nuevos desde el panel o migraciones, sin reejecutar todo RolesPermissionsSeeder.
 */
class SyncAdministratorPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $all = Permission::all();
        if ($all->isEmpty()) {
            if ($this->command) {
                $this->command->warn('No hay permisos en la base de datos. Ejecuta antes RolesPermissionsSeeder.');
            }
            return;
        }

        foreach (['administrator', 'super_admin'] as $roleName) {
            $role = Role::findByName($roleName);
            $role->syncPermissions($all);
            if ($this->command) {
                $this->command->info("Rol «{$roleName}» sincronizado con {$all->count()} permisos.");
            }
        }
    }
}
