<?php

namespace App\Jobs;

use App\Helpers\ApiResponseHelper;
use App\Models\Vehicle;
use App\Models\VehicleImage;
use App\Services\LocalImageS3Uploader;
use App\Services\VehiclePublishAuditService;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
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

    public function handle(LocalImageS3Uploader $uploader, VehiclePublishAuditService $publishAudit): void
    {
        $this->validateInputs();

        try {
            $name = time().'_'.$this->sort_id;
            $s3_path = $this->base_folder.'/'.$this->vehicle_uuid.'/'.$name.'.jpg';

            Log::info('Uploading image for vehicle (local optimize → S3 → CloudFront)', [
                'vehicle_id' => $this->vehicle_id,
                'vehicle_uuid' => $this->vehicle_uuid,
                'path' => $this->path,
                'sort_id' => $this->sort_id,
            ]);

            $uploaded = $uploader->putJpeg($this->path, $s3_path);
            $cdn_url = $uploaded['url'];

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
                            'optimizer' => $uploaded['driver'],
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
