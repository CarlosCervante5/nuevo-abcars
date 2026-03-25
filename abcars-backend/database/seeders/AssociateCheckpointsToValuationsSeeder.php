<?php

namespace Database\Seeders;

use App\Models\Valuations\VehicleValuation;
use App\Models\Valuations\ValuationCheckpoint;
use App\Models\Valuations\AcquisitionCheckpoint;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AssociateCheckpointsToValuationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Este seeder asocia los checkpoints a las valuaciones existentes que no los tengan.
     */
    public function run(): void
    {
        $valuation_checkpoints_ids = [
            1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,
            21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,
            41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,
            61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,
            81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,
            101,102,103,104,105,106,107,108,109,110,111,112,113,114,115
        ];

        $acquisition_checkpoints_ids = [
            1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,
            21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,
            41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,
            61,62,63,64,65,66,67,68,69
        ];

        // Obtener todas las valuaciones
        $valuations = VehicleValuation::all();
        
        echo "Procesando " . $valuations->count() . " valuaciones...\n";

        $checkpoints = ValuationCheckpoint::whereIn('id', $valuation_checkpoints_ids)->get();
        $acquisition_checkpoints = AcquisitionCheckpoint::whereIn('id', $acquisition_checkpoints_ids)->get();

        if ($checkpoints->isEmpty()) {
            echo "⚠️  No se encontraron checkpoints de valuación. Asegúrate de ejecutar ValuationCheckpointsSeeder primero.\n";
            return;
        }

        if ($acquisition_checkpoints->isEmpty()) {
            echo "⚠️  No se encontraron checkpoints de adquisición.\n";
        }

        $associated = 0;
        $skipped = 0;

        foreach ($valuations as $valuation) {
            // Verificar si ya tiene checkpoints asociados
            $hasCheckpoints = $valuation->checkpoints()->count() > 0;
            
            if (!$hasCheckpoints) {
                // Asociar checkpoints de valuación
                $valuation->checkpoints()->attach($checkpoints);
                
                // Asociar checkpoints de adquisición
                if ($acquisition_checkpoints->isNotEmpty()) {
                    $valuation->acquisition_checkpoints()->attach($acquisition_checkpoints);
                }
                
                $associated++;
                echo "✓ Checkpoints asociados a valuación ID: {$valuation->id} (UUID: {$valuation->uuid})\n";
            } else {
                $skipped++;
            }
        }

        echo "\n✅ Proceso completado:\n";
        echo "   - Valuaciones actualizadas: {$associated}\n";
        echo "   - Valuaciones que ya tenían checkpoints: {$skipped}\n";
    }
}






