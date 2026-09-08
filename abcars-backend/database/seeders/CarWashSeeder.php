<?php

namespace Database\Seeders;

use App\Models\CarWash\CarWashLocation;
use App\Models\CarWash\CarWashProduct;
use App\Models\CarWash\CarWashServiceType;
use App\Models\CarWash\CarWashWasher;
use Database\Seeders\Support\SeededUser;
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

        $location = CarWashLocation::query()->first();
        if (! $location) {
            $location = CarWashLocation::create([
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

        $products = [
            ['name' => 'Aromatizante spray', 'sku' => 'AM-AROMA', 'price' => 49, 'stock' => 50],
            ['name' => 'Funda volante', 'sku' => 'AM-FUNDA', 'price' => 129, 'stock' => 20],
            ['name' => 'Toalla microfibra', 'sku' => 'AM-TOALLA', 'price' => 89, 'stock' => 40],
            ['name' => 'Kit limpia vidrios', 'sku' => 'AM-VIDRIO', 'price' => 99, 'stock' => 25],
        ];

        foreach ($products as $product) {
            CarWashProduct::firstOrCreate(
                ['sku' => $product['sku']],
                array_merge($product, [
                    'description' => null,
                    'is_active' => true,
                ])
            );
        }

        $this->seedStaffUsers($location);
    }

    private function seedStaffUsers(CarWashLocation $location): void
    {
        $supervisorRole = Role::findByName('carwash_supervisor');
        $washerRole = Role::findByName('carwash_washer');

        $supervisor = SeededUser::findExistingOrCreate([
            'email' => 'carwash_supervisor@abcars.mx',
            'nickname' => 'carwash_supervisor',
            'password' => 'CarWashSupervisor%2026%%',
        ]);
        if (! $supervisor->hasRole('carwash_supervisor')) {
            $supervisor->assignRole($supervisorRole);
        }
        if (! $supervisor->userProfile) {
            $supervisor->userProfile()->create([
                'name' => 'Supervisor',
                'last_name' => 'CarWash',
                'location' => $location->name,
            ]);
        }

        $washer = SeededUser::findExistingOrCreate([
            'email' => 'carwash_lavador@abcars.mx',
            'nickname' => 'carwash_lavador',
            'password' => 'CarWashLavador%2026%%',
        ]);
        if (! $washer->hasRole('carwash_washer')) {
            $washer->assignRole($washerRole);
        }
        if (! $washer->userProfile) {
            $washer->userProfile()->create([
                'name' => 'Lavador',
                'last_name' => 'CarWash',
                'location' => $location->name,
            ]);
        }

        CarWashWasher::query()->firstOrCreate(
            ['user_id' => $washer->id],
            [
                'location_id' => $location->id,
                'display_name' => 'Lavador CarWash',
                'phone' => null,
                'is_active' => true,
            ]
        );

        if ($this->command) {
            $this->command->info('Usuarios CarWash:');
            $this->command->info('  Supervisor: carwash_supervisor@abcars.mx / CarWashSupervisor%2026%%');
            $this->command->info('  Lavador:    carwash_lavador@abcars.mx / CarWashLavador%2026%%');
        }
    }
}
