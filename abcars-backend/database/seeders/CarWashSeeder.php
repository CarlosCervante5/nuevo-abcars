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
            'manage carwash whatsapp',
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

        $legacyCodes = [
            'express', 'completo', 'interior', 'encerado', 'detailing', 'premium', 'moto', 'flota',
            // Catálogo anterior fuera de la lista vigente
            'lavado-aspirado-secado',
            'lavado-aspirado-secado-pulido',
            'descontaminacion-carroceria',
            'peliculas-filos-ppf',
            'detallado-ruedas',
        ];
        CarWashServiceType::query()->whereIn('code', $legacyCodes)->update(['is_active' => false]);

        $defaults = [
            [
                'name' => 'Lavado premium de carrocería',
                'code' => 'lavado-premium-carroceria',
                'duration_minutes' => 45,
                'price' => 250,
                'sort_order' => 1,
                'description' => 'Precio desde $250.00',
            ],
            [
                'name' => 'Descontaminación de rines',
                'code' => 'descontaminacion-rines',
                'duration_minutes' => 30,
                'price' => 250,
                'sort_order' => 2,
                'description' => 'Precio desde $250.00',
            ],
            [
                'name' => 'Detallado de pintura en rines (retoque)',
                'code' => 'detallado-rines',
                'duration_minutes' => 45,
                'price' => 650,
                'sort_order' => 3,
                'description' => 'Precio desde $650.00',
            ],
            [
                'name' => 'Pulido y encerado de carrocería',
                'code' => 'lavado-pulido-encerado',
                'duration_minutes' => 120,
                'price' => 2000,
                'sort_order' => 4,
                'description' => 'Precio desde $2,000.00',
            ],
            [
                'name' => 'Lavado de vestiduras',
                'code' => 'lavado-vestiduras',
                'duration_minutes' => 90,
                'price' => 850,
                'sort_order' => 5,
                'description' => 'Precio desde $850.00',
            ],
            [
                'name' => 'Lavado de vestiduras y alfombras',
                'code' => 'lavado-vestiduras-intenso',
                'duration_minutes' => 150,
                'price' => 1800,
                'sort_order' => 6,
                'description' => 'Precio desde $1,800.00',
            ],
            [
                'name' => 'Lavado a detalle e hidratación de plásticos',
                'code' => 'rehidratacion-plasticos',
                'duration_minutes' => 60,
                'price' => 700,
                'sort_order' => 7,
                'description' => 'Precio desde $700.00',
            ],
            [
                'name' => 'Descontaminación de parabrisas',
                'code' => 'descontaminacion-parabrisas',
                'duration_minutes' => 45,
                'price' => 600,
                'sort_order' => 8,
                'description' => 'Precio desde $600.00',
            ],
            [
                'name' => 'Lavado exterior de motor',
                'code' => 'lavado-exterior-motor',
                'duration_minutes' => 45,
                'price' => 600,
                'sort_order' => 9,
                'description' => 'Precio desde $600.00',
            ],
            [
                'name' => 'Protección nanocerámica',
                'code' => 'nanoceramico',
                'duration_minutes' => 240,
                'price' => 4000,
                'sort_order' => 10,
                'description' => 'Precio desde $4,000.00',
            ],
            [
                'name' => 'Películas de protección solar',
                'code' => 'peliculas-proteccion-solar',
                'duration_minutes' => 180,
                'price' => 3700,
                'sort_order' => 11,
                'description' => 'Precio desde $3,700.00',
            ],
            [
                'name' => 'Filos PPF (Paint Protection Film)',
                'code' => 'filos-ppf',
                'duration_minutes' => 60,
                'price' => 350,
                'sort_order' => 12,
                'description' => 'Precio desde $350.00',
            ],
            [
                'name' => 'PPF Pieza',
                'code' => 'ppf-pieza',
                'duration_minutes' => 120,
                'price' => 3500,
                'sort_order' => 13,
                'description' => 'Precio desde $3,500.00',
            ],
            [
                'name' => 'PPF Completo',
                'code' => 'ppf-completo',
                'duration_minutes' => 480,
                'price' => 65000,
                'sort_order' => 14,
                'description' => 'Precio desde $65,000.00',
            ],
            [
                'name' => 'Inflado de llantas con nitrógeno',
                'code' => 'nitrogeno-llantas',
                'duration_minutes' => 20,
                'price' => 600,
                'sort_order' => 15,
                'description' => 'Precio desde $600.00',
            ],
            [
                'name' => 'Pintura de fascia sin reparación (express)',
                'code' => 'pintura-fascia-express',
                'duration_minutes' => 120,
                'price' => 1800,
                'sort_order' => 16,
                'description' => 'Precio desde $1,800.00',
            ],
        ];

        foreach ($defaults as $service) {
            CarWashServiceType::updateOrCreate(
                ['code' => $service['code']],
                array_merge($service, [
                    'is_active' => true,
                ])
            );
        }

        $products = [
            // Líquidos de lavado
            [
                'name' => 'Shampoo de lavado 5 L',
                'sku' => 'LQ-SHAMPOO-5L',
                'price' => 189,
                'stock' => 30,
                'description' => 'Líquido concentrado para espuma activa en carrocería.',
            ],
            [
                'name' => 'Espuma activa 1 L',
                'sku' => 'LQ-ESPUMA-1L',
                'price' => 129,
                'stock' => 40,
                'description' => 'Pre-lavado con espuma de alto agarre.',
            ],
            [
                'name' => 'Desengrasante motor 1 L',
                'sku' => 'LQ-DESENGRASE-1L',
                'price' => 99,
                'stock' => 35,
                'description' => 'Líquido desengrasante para compartimento de motor.',
            ],
            [
                'name' => 'Limpiador de llantas 1 L',
                'sku' => 'LQ-LLANTAS-1L',
                'price' => 89,
                'stock' => 45,
                'description' => 'Removedor de polvo de freno y suciedad en rines.',
            ],
            [
                'name' => 'Limpiavidrios 750 ml',
                'sku' => 'LQ-VIDRIOS-750',
                'price' => 59,
                'stock' => 60,
                'description' => 'Líquido antirrayas para cristales y espejos.',
            ],
            [
                'name' => 'Limpiador de interiores 1 L',
                'sku' => 'LQ-INTERIOR-1L',
                'price' => 79,
                'stock' => 40,
                'description' => 'Multiusos para tablero, puertas y plásticos.',
            ],
            // Ceras
            [
                'name' => 'Cera líquida 500 ml',
                'sku' => 'CX-LIQUIDA-500',
                'price' => 149,
                'stock' => 28,
                'description' => 'Cera lista para aplicar con brillo rápido.',
            ],
            [
                'name' => 'Cera en pasta 300 g',
                'sku' => 'CX-PASTA-300',
                'price' => 179,
                'stock' => 22,
                'description' => 'Cera en pasta de protección prolongada.',
            ],
            [
                'name' => 'Spray wax 400 ml',
                'sku' => 'CX-SPRAY-400',
                'price' => 119,
                'stock' => 35,
                'description' => 'Cera en aerosol para mantenimiento entre lavados.',
            ],
            [
                'name' => 'Sellador cerámico 50 ml',
                'sku' => 'CX-CERAMICO-50',
                'price' => 349,
                'stock' => 12,
                'description' => 'Protección tipo cerámica de alto brillo (prueba).',
            ],
            // Trapos / textiles
            [
                'name' => 'Trapo de microfibra (unidad)',
                'sku' => 'TR-MICRO-1',
                'price' => 35,
                'stock' => 120,
                'description' => 'Paño de microfibra para secado y detalle.',
            ],
            [
                'name' => 'Pack 5 trapos microfibra',
                'sku' => 'TR-MICRO-5',
                'price' => 149,
                'stock' => 40,
                'description' => 'Paquete de 5 trapos de colores surtidos.',
            ],
            [
                'name' => 'Toalla de secado grande',
                'sku' => 'TR-SECADO-LG',
                'price' => 129,
                'stock' => 30,
                'description' => 'Toalla absorbente 60×90 cm para carrocería.',
            ],
            [
                'name' => 'Aplicador de cera (esponja)',
                'sku' => 'TR-APLICADOR',
                'price' => 29,
                'stock' => 80,
                'description' => 'Esponja aplicadora para ceras y selladores.',
            ],
            // Amenidades / extras
            [
                'name' => 'Aromatizante spray',
                'sku' => 'AM-AROMA',
                'price' => 49,
                'stock' => 50,
                'description' => 'Aromatizante para habitáculo.',
            ],
            [
                'name' => 'Funda volante',
                'sku' => 'AM-FUNDA',
                'price' => 129,
                'stock' => 20,
                'description' => 'Funda universal de volante.',
            ],
            [
                'name' => 'Toalla microfibra (venta)',
                'sku' => 'AM-TOALLA',
                'price' => 89,
                'stock' => 40,
                'description' => 'Toalla de microfibra para venta al cliente.',
            ],
            [
                'name' => 'Kit limpia vidrios',
                'sku' => 'AM-VIDRIO',
                'price' => 99,
                'stock' => 25,
                'description' => 'Kit líquido + paño para cristales.',
            ],
            // Cafetería / alimentos
            [
                'name' => 'Café americano',
                'sku' => 'AL-CAFE-AMER',
                'category' => 'food',
                'price' => 35,
                'stock' => 100,
                'description' => 'Cafetería · bebida caliente.',
            ],
            [
                'name' => 'Café con leche',
                'sku' => 'AL-CAFE-LECHE',
                'category' => 'food',
                'price' => 45,
                'stock' => 100,
                'description' => 'Cafetería · bebida caliente.',
            ],
            [
                'name' => 'Capuchino',
                'sku' => 'AL-CAPUCHINO',
                'category' => 'food',
                'price' => 55,
                'stock' => 80,
                'description' => 'Cafetería · bebida caliente.',
            ],
            [
                'name' => 'Chocolate caliente',
                'sku' => 'AL-CHOCO',
                'category' => 'food',
                'price' => 50,
                'stock' => 80,
                'description' => 'Cafetería · bebida caliente.',
            ],
            [
                'name' => 'Té',
                'sku' => 'AL-TE',
                'category' => 'food',
                'price' => 30,
                'stock' => 80,
                'description' => 'Cafetería · bebida caliente.',
            ],
            [
                'name' => 'Agua embotellada 600 ml',
                'sku' => 'AL-AGUA-600',
                'category' => 'food',
                'price' => 20,
                'stock' => 120,
                'description' => 'Cafetería · bebida fría.',
            ],
            [
                'name' => 'Refresco lata',
                'sku' => 'AL-REFRESCO',
                'category' => 'food',
                'price' => 25,
                'stock' => 100,
                'description' => 'Cafetería · bebida fría.',
            ],
            [
                'name' => 'Jugo natural',
                'sku' => 'AL-JUGO',
                'category' => 'food',
                'price' => 40,
                'stock' => 60,
                'description' => 'Cafetería · bebida fría.',
            ],
            [
                'name' => 'Agua de sabor',
                'sku' => 'AL-AGUA-SABOR',
                'category' => 'food',
                'price' => 30,
                'stock' => 60,
                'description' => 'Cafetería · bebida fría.',
            ],
            [
                'name' => 'Pan dulce (pieza)',
                'sku' => 'AL-PAN-DULCE',
                'category' => 'food',
                'price' => 25,
                'stock' => 50,
                'description' => 'Cafetería · panadería.',
            ],
            [
                'name' => 'Dona',
                'sku' => 'AL-DONA',
                'category' => 'food',
                'price' => 30,
                'stock' => 40,
                'description' => 'Cafetería · panadería.',
            ],
            [
                'name' => 'Galletas surtidas',
                'sku' => 'AL-GALLETAS',
                'category' => 'food',
                'price' => 20,
                'stock' => 60,
                'description' => 'Cafetería · snack.',
            ],
            [
                'name' => 'Sandwich jamón y queso',
                'sku' => 'AL-SANDWICH',
                'category' => 'food',
                'price' => 55,
                'stock' => 30,
                'description' => 'Cafetería · comida rápida.',
            ],
            [
                'name' => 'Torta de milanesa',
                'sku' => 'AL-TORTA',
                'category' => 'food',
                'price' => 75,
                'stock' => 25,
                'description' => 'Cafetería · comida rápida.',
            ],
            [
                'name' => 'Hot dog',
                'sku' => 'AL-HOTDOG',
                'category' => 'food',
                'price' => 45,
                'stock' => 30,
                'description' => 'Cafetería · comida rápida.',
            ],
            [
                'name' => 'Nachos con queso',
                'sku' => 'AL-NACHOS',
                'category' => 'food',
                'price' => 50,
                'stock' => 30,
                'description' => 'Cafetería · snack.',
            ],
            [
                'name' => 'Papas fritas',
                'sku' => 'AL-PAPAS',
                'category' => 'food',
                'price' => 40,
                'stock' => 30,
                'description' => 'Cafetería · snack.',
            ],
            [
                'name' => 'Yogurt con granola',
                'sku' => 'AL-YOGURT',
                'category' => 'food',
                'price' => 40,
                'stock' => 25,
                'description' => 'Cafetería · snack.',
            ],
            [
                'name' => 'Barra energética',
                'sku' => 'AL-BARRA',
                'category' => 'food',
                'price' => 30,
                'stock' => 40,
                'description' => 'Cafetería · snack.',
            ],
            [
                'name' => 'Fruta del día',
                'sku' => 'AL-FRUTA',
                'category' => 'food',
                'price' => 35,
                'stock' => 25,
                'description' => 'Cafetería · snack.',
            ],
        ];

        foreach ($products as $product) {
            CarWashProduct::updateOrCreate(
                ['sku' => $product['sku']],
                array_merge($product, [
                    'category' => $product['category'] ?? 'amenity',
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
