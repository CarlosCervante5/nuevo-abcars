<?php

namespace App\Console\Commands;

use App\Models\VehicleImage;
use Cloudinary\Cloudinary;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class HardDeleteVehicleImagesCommand extends Command
{
    protected $signature = 'vehicles:hard-delete-images
                            {--dry-run : Solo listar, no eliminar}';

    protected $description = 'Hard-delete de imágenes soft-deleted tras 1 mes calendario (Cloudinary o S3 + fila BD). El vehículo soft-deleted NO se elimina.';

    public function handle(Cloudinary $cloudinary): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $cutoff = now()->subMonth();
        $cloudfront = rtrim((string) env('AWS_CLOUDFRONT_URL', ''), '/');

        $query = VehicleImage::onlyTrashed()
            ->where('deleted_at', '<=', $cutoff);

        $count = $query->count();

        if ($count === 0) {
            $this->info('Sin imágenes soft-deleted elegibles (≥ 1 mes calendario).');

            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->warn("Dry-run: {$count} imagen(es) se hard-eliminarían.");
            $query->orderBy('deleted_at')->limit(50)->get(['uuid', 'service_public_id', 'service_image_url', 'deleted_at', 'vehicle_id'])
                ->each(function (VehicleImage $img) use ($cloudfront) {
                    $backend = $this->storageBackend(
                        (string) ($img->service_image_url ?? ''),
                        trim((string) ($img->service_public_id ?? '')),
                        $cloudfront
                    );
                    $this->line(
                        ($img->uuid ?? '?') . ' | vehicle_id=' . $img->vehicle_id
                        . ' | backend=' . $backend
                        . ' | deleted_at=' . optional($img->deleted_at)->toDateTimeString()
                        . ' | id=' . ($img->service_public_id ?: '(vacío)')
                    );
                });

            return self::SUCCESS;
        }

        $removed = 0;
        $remoteErrors = 0;

        $query->orderBy('id')->chunkById(50, function ($images) use ($cloudinary, $cloudfront, &$removed, &$remoteErrors) {
            foreach ($images as $image) {
                $url = (string) ($image->service_image_url ?? '');
                $publicId = trim((string) ($image->service_public_id ?? ''));
                $backend = $this->storageBackend($url, $publicId, $cloudfront);

                try {
                    if ($backend === 'cloudinary' && $this->shouldDestroyOnCloudinary($publicId)) {
                        $cloudinary->uploadApi()->destroy($publicId);
                    } elseif ($backend === 's3' && $publicId !== '') {
                        Storage::disk('s3')->delete($publicId);
                    }
                } catch (\Throwable $e) {
                    $remoteErrors++;
                    Log::warning('vehicles:hard-delete-images borrado remoto falló', [
                        'uuid' => $image->uuid,
                        'backend' => $backend,
                        'public_id' => $publicId,
                        'message' => $e->getMessage(),
                    ]);
                }

                $image->forceDelete();
                $removed++;
            }
        });

        $this->info("Hard-delete completado: {$removed} imagen(es). Errores remotos: {$remoteErrors}.");

        return self::SUCCESS;
    }

    /**
     * @return 'cloudinary'|'s3'|'none'
     */
    private function storageBackend(string $url, string $publicId, string $cloudfront): string
    {
        if ($publicId === '' || str_starts_with($publicId, 'intelimotor:') || str_starts_with($publicId, 'seed_')) {
            return 'none';
        }

        $urlLower = strtolower($url);

        if (str_contains($urlLower, 'cloudinary.com') || str_contains($urlLower, 'res.cloudinary')) {
            return 'cloudinary';
        }

        if (
            ($cloudfront !== '' && str_starts_with($url, $cloudfront))
            || str_contains($urlLower, 'cloudfront.net')
            || str_contains($urlLower, 'amazonaws.com')
            || str_contains($publicId, '/')
        ) {
            // Nuevos uploads guardan la clave S3 en service_public_id (contiene '/').
            return 's3';
        }

        // Histórico Cloudinary: public_id sin URL clara.
        return 'cloudinary';
    }

    private function shouldDestroyOnCloudinary(string $publicId): bool
    {
        if ($publicId === '') {
            return false;
        }

        if (str_starts_with($publicId, 'intelimotor:') || str_starts_with($publicId, 'seed_')) {
            return false;
        }

        return true;
    }
}
