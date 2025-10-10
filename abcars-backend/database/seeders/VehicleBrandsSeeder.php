<?php

namespace Database\Seeders;

use App\Models\VehicleBrand;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class VehicleBrandsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $brands = [
            ['name' => 'chevrolet'],
            ['name' => 'ford'],
            ['name' => 'toyota'],
            ['name' => 'honda'],
            ['name' => 'nissan'],
            ['name' => 'volkswagen'],
            ['name' => 'hyundai'],
            ['name' => 'kia'],
            ['name' => 'mazda'],
            ['name' => 'bmw'],
            ['name' => 'mercedes-benz'],
            ['name' => 'audi'],
            ['name' => 'mitsubishi'],
            ['name' => 'suzuki'],
            ['name' => 'subaru'],
            ['name' => 'jeep'],
            ['name' => 'dodge'],
            ['name' => 'fiat'],
            ['name' => 'renault'],
            ['name' => 'peugeot'],
            ['name' => 'seat'],
            ['name' => 'skoda'],
            ['name' => 'volvo'],
            ['name' => 'lexus'],
            ['name' => 'acura'],
            ['name' => 'infiniti'],
            ['name' => 'cadillac'],
            ['name' => 'buick'],
            ['name' => 'gmc'],
            ['name' => 'lincoln'],
            ['name' => 'mini'],
            ['name' => 'smart'],
            ['name' => 'dacia'],
            ['name' => 'lada'],
            ['name' => 'great wall'],
            ['name' => 'byd'],
            ['name' => 'chery'],
            ['name' => 'geely'],
            ['name' => 'mg'],
            ['name' => 'jac'],
        ];

        foreach ($brands as $brand) {
            VehicleBrand::firstOrCreate($brand);
        }
    }
}
