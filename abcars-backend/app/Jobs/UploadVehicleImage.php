<?php

namespace App\Jobs;

use App\Helpers\ApiResponseHelper;
use App\Models\Vehicle;
use App\Models\VehicleImage;
use App\Services\VehicleImageOptimizer;
use App\Services\VehiclePublishAuditService;
use App\Support\CloudinaryVehicleUploadTransform;
use Cloudinary\Cloudinary;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Por defecto (VEHICLE_IMAGE_OPTIMIZER=local):
 * storage → Imagick/GD (JPEG + flatten) → S3 → URL CloudFront en BD.
 *
 * Legacy (VEHICLE_IMAGE_OPTIMIZER=cloudinary):
 * storage → Cloudinary → S3 → CloudFront → destroy temporal Cloudinary.
 */
class UploadVehicleImage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $path;

    protected $vehicle_id;

    protected $vehicle_uuid;

    protected $sort_id;

    protected $original_filename;

    protected $is_last;

    protected $user_id;

    public $tries = 5;

    public $backoff = 60;

    protected $base_folder;

    protected $aws_url;

    protected $cloudinary_temp_folder;

    public function __construct(
        string $path,
        string $vehicle_uuid,
        int $vehicle_id,
        int $index,
        string $original_filename,
        bool $is_last,
        ?int $user_id = null,
    ) {
        $this->path = $path;
        $this->vehicle_uuid = $vehicle_uuid;
        $this->vehicle_id = $vehicle_id;
        $this->sort_id = $index;
        $this->original_filename = $original_filename;
        $this->is_last = $is_last;
        $this->user_id = $user_id;
        $this->base_folder = env('AWS_VEHICLES_FOLDER_BASE', env('CLOUDINARY_VEHICLES_FOLDER_BASE', 'abcars_images'));
        $this->aws_url = rtrim((string) env('AWS_CLOUDFRONT_URL', ''), '/');
        $this->cloudinary_temp_folder = env('CLOUDINARY_VEHICLES_FOLDER_BASE', 'abcars_images');
    }

    public function handle(VehicleImageOptimizer $optimizer, VehiclePublishAuditService $publishAudit): void
    {
        $this->validateInputs();

        $mode = strtolower((string) Config::get('vehicle_images.optimizer', 'local'));

        try {
            $name = time().'_'.$this->sort_id;
            $s3_path = $this->base_folder.'/'.$this->vehicle_uuid.'/'.$name.'.jpg';

            if ($mode === 'cloudinary') {
                $image_contents = $this->optimizeViaCloudinary($name);
            } else {
                Log::info('Uploading image for vehicle (local optimize → S3 → CloudFront)', [
                    'vehicle_id' => $this->vehicle_id,
                    'vehicle_uuid' => $this->vehicle_uuid,
                    'path' => $this->path,
                    'sort_id' => $this->sort_id,
                ]);

                $optimized = $optimizer->optimizeFileToJpeg(storage_path('app/'.$this->path));
                $image_contents = $optimized['binary'];
            }

            $s3_result = Storage::disk('s3')->put($s3_path, $image_contents);

            if (! $s3_result) {
                throw new Exception('Failed to upload image to S3');
            }

            $cdn_url = $this->aws_url.'/'.$s3_path;

            VehicleImage::create([
                'sort_id' => $this->sort_id,
                'image_name' => $this->original_filename,
                'vehicle_id' => $this->vehicle_id,
                // Clave S3 para hard-delete; no es public_id de Cloudinary.
                'service_public_id' => $s3_path,
                'service_image_url' => $cdn_url,
            ]);

            if ($this->is_last) {
                $vehicle = Vehicle::find($this->vehicle_id);
                if ($vehicle) {
                    $before = $vehicle->page_status;
                    $vehicle->update(['page_status' => 'active']);
                    $publishAudit->logPageStatusChange(
                        $vehicle->fresh(),
                        $before,
                        'active',
                        'upload_last_image',
                        $this->user_id,
                        [
                            'filename' => $this->original_filename,
                            'sort_id' => $this->sort_id,
                            'channel' => $this->user_id ? 'authenticated_upload' : 'system_upload',
                            'optimizer' => $mode === 'cloudinary' ? 'cloudinary' : 'local',
                        ],
                    );
                }
            }

            Storage::delete($this->path);

            ApiResponseHelper::imageSuccess(200, 'Imagen subida correctamente al servicio externo', ['url' => $cdn_url]);
        } catch (\Exception $e) {
            ApiResponseHelper::imageError('Error en el job para subir la imagen para id: '.$this->vehicle_id, $e->getMessage(), 500, 'UPLOAD_IMAGE_ERROR');

            ApiResponseHelper::imageError('Imagen guardada localmente para vehículo uuid: '.$this->vehicle_uuid, 'Guardada en: '.$this->path, 500, 'SAVE_LOCAL_IMAGE_ERROR');
            throw $e;
        }
    }

    /**
     * Legacy: Cloudinary solo como paso de optimización; el archivo definitivo vive en S3.
     */
    protected function optimizeViaCloudinary(string $name): string
    {
        Log::info('Uploading image for vehicle (Cloudinary → S3 → CloudFront)', [
            'vehicle_id' => $this->vehicle_id,
            'vehicle_uuid' => $this->vehicle_uuid,
            'path' => $this->path,
            'sort_id' => $this->sort_id,
        ]);

        /** @var Cloudinary $cloudinary */
        $cloudinary = app(Cloudinary::class);

        $cloudinary_file = $cloudinary->uploadApi()->upload(storage_path('app/'.$this->path), [
            'public_id' => $name,
            'folder' => $this->cloudinary_temp_folder.'/'.$this->vehicle_uuid,
            'transformation' => CloudinaryVehicleUploadTransform::incomingFlattenTransformation(),
        ]);

        $cloudinary_url = $cloudinary_file['secure_url'] ?? null;
        $cloudinary_public_id = $cloudinary_file['public_id'] ?? null;

        if (! $cloudinary_url) {
            throw new Exception('Cloudinary upload did not return secure_url');
        }

        $image_contents = file_get_contents($cloudinary_url);
        if ($image_contents === false) {
            throw new Exception('Failed to download optimized image from Cloudinary');
        }

        if ($cloudinary_public_id) {
            try {
                $cloudinary->uploadApi()->destroy($cloudinary_public_id);
            } catch (\Throwable $e) {
                Log::warning('No se pudo borrar temporal en Cloudinary tras subir a S3', [
                    'public_id' => $cloudinary_public_id,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        return $image_contents;
    }

    protected function validateInputs(): void
    {
        $requiredFields = [
            'path' => $this->path,
            'vehicle_uuid' => $this->vehicle_uuid,
            'vehicle_id' => $this->vehicle_id,
            'sort_id' => $this->sort_id,
            'original_filename' => $this->original_filename,
            'aws_url' => $this->aws_url,
            'base_folder' => $this->base_folder,
        ];

        foreach ($requiredFields as $field => $value) {
            if ($value === null || $value === '') {
                throw new Exception("{$field} is required");
            }
        }
    }
}
