<?php

namespace App\Console\Commands;

use App\Models\Vehicle;
use Illuminate\Console\Command;

class PurgeSoldVehiclesCommand extends Command
{
    protected $signature = 'vehicles:purge-sold
                            {--dry-run : Solo listar, no eliminar}';

    protected $description = 'Soft-delete de vehículos vendidos por Intelimotor tras 1 mes calendario desde sold_at (imágenes en soft-delete; el vehículo permanece soft-deleted)';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $cutoff = now()->subMonth();

        // Solo ventas originadas por sync Intelimotor (tienen unit_id y no hay override manual de estatus).
        $query = Vehicle::query()
            ->where('page_status', 'sale')
            ->whereNotNull('sold_at')
            ->where('sold_at', '<=', $cutoff)
            ->whereNotNull('intelimotor_unit_id')
            ->where('intelimotor_unit_id', '<>', '')
            ->whereNull('page_status_manual_at');

        $count = $query->count();

        if ($count === 0) {
            $this->info('Sin vehículos elegibles para purga (≥ 1 mes calendario desde sold_at).');

            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->warn("Dry-run: {$count} vehículo(s) se soft-eliminarían (el auto queda en papelera; imágenes soft).");
            $query->orderBy('sold_at')->limit(50)->get(['uuid', 'vin', 'name', 'sold_at'])
                ->each(fn (Vehicle $v) => $this->line(
                    ($v->vin ?: '(sin vin)') . ' | sold_at=' . optional($v->sold_at)->toDateTimeString()
                ));

            return self::SUCCESS;
        }

        $purged = 0;
        $query->orderBy('id')->chunkById(50, function ($vehicles) use (&$purged) {
            foreach ($vehicles as $vehicle) {
                // Soft-delete del auto; el modelo soft-borra imágenes en cascada. NO hard-delete del vehículo.
                $vehicle->delete();
                $purged++;
            }
        });

        $this->info("Purgados (soft-delete del vehículo): {$purged}. Las imágenes se hard-borran aparte tras 1 mes con vehicles:hard-delete-images.");

        return self::SUCCESS;
    }
}
