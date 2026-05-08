<?php

namespace Database\Seeders;

use App\Models\Dealership;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DealershipsSeeder extends Seeder
{
    /**
     * Sucursales reales ABCars (alineadas con el home).
     * Elimina el resto de sucursales y desasocia vehículos (hay que reasignar en admin si aplica).
     */
    public function run(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');
        DB::table($prefix . 'vehicles')->update(['dealership_id' => null]);
        DB::table($prefix . 'vehicle_valuations')->update(['dealership_id' => null]);

        foreach (Dealership::withTrashed()->get() as $d) {
            $d->forceDelete();
        }

        $sucursales = [
            [
                'name' => 'ventas matriz',
                'location' => 'puebla',
                'service_types' => ['venta', 'valuaciones'],
                'description' => 'VENTAS MATRIZ',
                'address' => "Blvrd Esteban de Antuñano 1314\nObrera Textil José Abascal\n72130 Puebla, Pue.",
            ],
            [
                'name' => 'ventas serdan',
                'location' => 'puebla',
                'service_types' => ['venta', 'valuaciones'],
                'description' => 'VENTAS SERDAN',
                'address' => "Boulevard Hermanos Serdán 241\nAmpliación Aquiles Serdán\nPuebla, Pue.",
            ],
            [
                'name' => 'ventas sucursal tlaxcala',
                'location' => 'zacatelco',
                'service_types' => ['venta', 'valuaciones'],
                'description' => 'VENTAS SUCURSAL TLAXCALA',
                'address' => "Carr. Federal Puebla - Tlaxcala Km 18.5\nBarrio de Guardia\n90740 Zacatelco, Tlax.",
            ],
            [
                'name' => 'service body paint',
                'location' => 'puebla',
                'service_types' => ['servicios'],
                'description' => 'SERVICE, BODY & PAINT',
                'address' => "Av. 31 Pte. 4110 Ampliación Reforma Sur\nC.P. 72160, Puebla, Pue.",
            ],
            [
                'name' => 'ventas sucursal hidalgo',
                'location' => 'pachuca',
                'service_types' => ['venta', 'valuaciones'],
                'description' => 'VENTAS SUCURSAL HIDALGO',
                'address' => "Vial, La Paz 113, Adolfo López Mateos\n42094 Pachuca de Soto, Hgo.",
            ],
            [
                'name' => 'ventas sucursal cholula',
                'location' => 'puebla',
                'service_types' => ['venta', 'valuaciones'],
                'description' => 'VENTAS SUCURSAL CHOLULA',
                'address' => "Lateral Norte Recta a Cholula no. 1408 San Andres Choula\n72819 Puebla, Pue.",
            ],
        ];

        foreach ($sucursales as $row) {
            Dealership::create($row);
        }
    }
}
