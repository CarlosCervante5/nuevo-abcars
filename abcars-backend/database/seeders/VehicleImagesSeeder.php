<?php

namespace Database\Seeders;

use App\Models\Vehicle;
use App\Models\VehicleImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class VehicleImagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // URL de imagen de ejemplo de un Chevrolet Trax negro
        $imageUrl = 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
        
        // Nombre de la imagen
        $imageName = 'chevrolet-trax-demo.jpg';
        
        // Crear directorio si no existe
        if (!Storage::disk('public')->exists('vehicles')) {
            Storage::disk('public')->makeDirectory('vehicles');
        }
        
        // Obtener todos los vehículos
        $vehicles = Vehicle::all();
        
        if ($vehicles->isEmpty()) {
            echo "No hay vehículos en la base de datos. Ejecuta primero VehiclesDemoSeeder.\n";
            return;
        }
        
        echo "Agregando imagen a " . $vehicles->count() . " vehículos...\n";
        
        foreach ($vehicles as $vehicle) {
            // Verificar si el vehículo ya tiene imágenes
            $existingImages = VehicleImage::where('vehicle_id', $vehicle->id)->count();
            
            if ($existingImages == 0) {
                // Crear registro de imagen para el vehículo
                VehicleImage::create([
                    'sort_id' => 1,
                    'image_name' => $imageName,
                    'service_public_id' => 'demo_' . $vehicle->id . '_' . time(),
                    'service_image_url' => $imageUrl,
                    'vehicle_id' => $vehicle->id,
                ]);
                
                echo "✅ Imagen agregada al vehículo: {$vehicle->name}\n";
            } else {
                echo "⚠️  El vehículo {$vehicle->name} ya tiene {$existingImages} imagen(es)\n";
            }
        }
        
        echo "\n🎉 Proceso completado!\n";
    }
} 