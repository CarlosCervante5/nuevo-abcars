<?php

namespace App\Services;

use App\Support\CloudinaryVehicleUploadTransform;
use Cloudinary\Cloudinary;
use Exception;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Optimiza un JPEG en el servidor y lo sube a S3/CloudFront.
 * Por defecto no usa Cloudinary (VEHICLE_IMAGE_OPTIMIZER=local).
 */
class LocalImageS3Uploader
{
    public function __construct(private VehicleImageOptimizer $optimizer) {}

    /**
     * @return array{url: string, path: string, bytes: int, driver: string}
     */
    public function putJpeg(string $storageRelativePath, string $s3Path): array
    {
        $absolute = storage_path('app/'.$storageRelativePath);
        $contents = $this->optimizeToJpeg($absolute, basename($s3Path, '.jpg'));
        $cdnUrl = $this->putBinary($s3Path, $contents['binary']);

        return [
            'url' => $cdnUrl,
            'path' => $s3Path,
            'bytes' => strlen($contents['binary']),
            'driver' => $contents['driver'],
        ];
    }

    public function cloudfrontBase(): string
    {
        $url = rtrim((string) env('AWS_CLOUDFRONT_URL', ''), '/');
        if ($url === '') {
            throw new Exception('AWS_CLOUDFRONT_URL is required');
        }

        return $url;
    }

    /**
     * @return array{binary: string, driver: string}
     */
    public function optimizeToJpeg(string $absolutePath, string $nameForCloudinary = 'upload'): array
    {
        $mode = strtolower((string) Config::get('vehicle_images.optimizer', 'local'));

        if ($mode === 'cloudinary') {
            return [
                'binary' => $this->optimizeViaCloudinary($absolutePath, $nameForCloudinary),
                'driver' => 'cloudinary',
            ];
        }

        $optimized = $this->optimizer->optimizeFileToJpeg($absolutePath);

        return [
            'binary' => $optimized['binary'],
            'driver' => $optimized['driver'],
        ];
    }

    public function putBinary(string $s3Path, string $binary): string
    {
        $ok = Storage::disk('s3')->put($s3Path, $binary);
        if (! $ok) {
            throw new Exception('Failed to upload image to S3');
        }

        return $this->cloudfrontBase().'/'.$s3Path;
    }

    protected function optimizeViaCloudinary(string $absolutePath, string $name): string
    {
        Log::info('Optimizing image via Cloudinary (legacy)', ['path' => $absolutePath]);

        /** @var Cloudinary $cloudinary */
        $cloudinary = app(Cloudinary::class);
        $folder = env('CLOUDINARY_VEHICLES_FOLDER_BASE', 'abcars_images').'/tmp_optimize';

        $cloudinaryFile = $cloudinary->uploadApi()->upload($absolutePath, [
            'public_id' => $name.'_'.time(),
            'folder' => $folder,
            'transformation' => CloudinaryVehicleUploadTransform::incomingFlattenTransformation(),
        ]);

        $url = $cloudinaryFile['secure_url'] ?? null;
        $publicId = $cloudinaryFile['public_id'] ?? null;
        if (! $url) {
            throw new Exception('Cloudinary upload did not return secure_url');
        }

        $contents = file_get_contents($url);
        if ($contents === false) {
            throw new Exception('Failed to download optimized image from Cloudinary');
        }

        if ($publicId) {
            try {
                $cloudinary->uploadApi()->destroy($publicId);
            } catch (\Throwable $e) {
                Log::warning('No se pudo borrar temporal Cloudinary', [
                    'public_id' => $publicId,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        return $contents;
    }
}
