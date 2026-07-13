<?php

namespace App\Console\Commands;

use App\Models\VehicleImage;
use Cloudinary\Cloudinary;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class HardDeleteVehicleImagesCommand extends Command
{
    protected $signature = 'vehicles:hard-delete-images
                            {--dry-run : Solo listar, no eliminar}';

    protected $description = 'Hard-delete de imágenes soft-deleted tras 1 mes calendario (Cloudinary + fila BD). El vehículo soft-deleted NO se elimina.';

    public function handle(Cloudinary $cloudinary): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $cutoff = now()->subMonth();

        $query = VehicleImage::onlyTrashed()
            ->where('deleted_at', '<=', $cutoff);

        $count = $query->count();

        if ($count === 0) {
            $this->info('Sin imágenes soft-deleted elegibles (≥ 1 mes calendario).');

            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->warn("Dry-run: {$count} imagen(es) se hard-eliminarían.");
            $query->orderBy('deleted_at')->limit(50)->get(['uuid', 'service_public_id', 'deleted_at', 'vehicle_id'])
                ->each(fn (VehicleImage $img) => $this->line(
                    ($img->uuid ?? '?') . ' | vehicle_id=' . $img->vehicle_id
                    . ' | deleted_at=' . optional($img->deleted_at)->toDateTimeString()
                    . ' | public_id=' . ($img->service_public_id ?: '(vacío)')
                ));

            return self::SUCCESS;
        }

        $removed = 0;
        $cloudinaryErrors = 0;

        $query->orderBy('id')->chunkById(50, function ($images) use ($cloudinary, &$removed, &$cloudinaryErrors) {
            foreach ($images as $image) {
                $publicId = trim((string) $image->service_public_id);

                if ($this->shouldDestroyOnCloudinary($publicId)) {
                    try {
                        $cloudinary->uploadApi()->destroy($publicId);
                    } catch (\Throwable $e) {
                        $cloudinaryErrors++;
                        Log::warning('vehicles:hard-delete-images Cloudinary destroy falló', [
                            'uuid' => $image->uuid,
                            'public_id' => $publicId,
                            'message' => $e->getMessage(),
                        ]);
                        // Seguimos con forceDelete de BD para no dejar basura local eterna.
                    }
                }

                $image->forceDelete();
                $removed++;
            }
        });

        $this->info("Hard-delete completado: {$removed} imagen(es). Errores Cloudinary: {$cloudinaryErrors}.");

        return self::SUCCESS;
    }

    /**
     * IDs sintéticos (p. ej. intelimotor:…) no existen en Cloudinary.
     */
    private function shouldDestroyOnCloudinary(string $publicId): bool
    {
        if ($publicId === '') {
            return false;
        }

        if (str_starts_with($publicId, 'intelimotor:')) {
            return false;
        }

        if (str_starts_with($publicId, 'seed_')) {
            return false;
        }

        return true;
    }
}
