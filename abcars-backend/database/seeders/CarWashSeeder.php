<?php

namespace Database\Seeders;

use App\Models\CarWash\CarWashLocation;
use App\Models\CarWash\CarWashServiceType;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class CarWashSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'view carwash',
            'manage carwash appointments',
            'manage carwash catalog',
            'manage carwash washers',
            'manage carwash pos',
            'manage carwash whatsapp',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name]);
        }

        $adminRoles = ['carwash_admin', 'carwash_supervisor', 'carwash_cashier', 'carwash_washer', 'carwash_agent'];
        foreach ($adminRoles as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }

        Role::findByName('carwash_admin')->syncPermissions($permissions);
        Role::findByName('carwash_supervisor')->syncPermissions([
            'view carwash',
            'manage carwash appointments',
            'manage carwash washers',
        ]);
        Role::findByName('carwash_cashier')->syncPermissions([
            'view carwash',
            'manage carwash appointments',
            'manage carwash pos',
        ]);
        Role::findByName('carwash_washer')->syncPermissions([
            'view carwash',
            'manage carwash appointments',
        ]);
        Role::findByName('carwash_agent')->syncPermissions([
            'view carwash',
            'manage carwash appointments',
            'manage carwash whatsapp',
        ]);

        foreach (['administrator', 'super_admin'] as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->givePermissionTo($permissions);
        }

        if (! CarWashLocation::query()->exists()) {
            CarWashLocation::create([
                'name' => 'CarWash ABCars Centro',
                'code' => 'cw-centro',
                'phone' => null,
                'address' => null,
                'is_active' => true,
            ]);
        }

        $defaults = [
            ['name' => 'Express', 'code' => 'express', 'duration_minutes' => 30, 'price' => 149, 'sort_order' => 1],
            ['name' => 'Completo', 'code' => 'completo', 'duration_minutes' => 60, 'price' => 249, 'sort_order' => 2],
            ['name' => 'Detailing', 'code' => 'detailing', 'duration_minutes' => 120, 'price' => 799, 'sort_order' => 3],
            ['name' => 'Moto', 'code' => 'moto', 'duration_minutes' => 40, 'price' => 129, 'sort_order' => 4],
        ];

        foreach ($defaults as $service) {
            CarWashServiceType::firstOrCreate(
                ['code' => $service['code']],
                array_merge($service, [
                    'description' => null,
                    'is_active' => true,
                ])
            );
        }
    }
}
