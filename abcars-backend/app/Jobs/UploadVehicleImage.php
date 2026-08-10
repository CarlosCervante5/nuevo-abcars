<?php

namespace App\Jobs;

use App\Helpers\ApiResponseHelper;
use App\Models\Vehicle;
use App\Models\VehicleImage;
use App\Support\CloudinaryVehicleUploadTransform;
use Cloudinary\Cloudinary;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Flujo híbrido (nuevo):
 * local → Cloudinary (optimizar) → S3 → URL CloudFront en BD → destroy temporal en Cloudinary.
 * Las imágenes históricas en Cloudinary no se migran; solo afectan uploads nuevos.
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
    public $tries = 5;
    public $backoff = 60;
    protected $base_folder;
    protected $aws_url;
    protected $cloudinary_temp_folder;

    /**
     * Create a new job instance.
     */
    public function __construct( String $path, String $vehicle_uuid, int $vehicle_id, int $index, String $original_filename, bool $is_last)
    {
        $this->path = $path;
        $this->vehicle_uuid = $vehicle_uuid;
        $this->vehicle_id = $vehicle_id;
        $this->sort_id = $index;
        $this->original_filename = $original_filename;
        $this->is_last = $is_last;
        $this->base_folder = env('AWS_VEHICLES_FOLDER_BASE', env('CLOUDINARY_VEHICLES_FOLDER_BASE', 'abcars_images'));
        $this->aws_url = rtrim((string) env('AWS_CLOUDFRONT_URL', ''), '/');
        $this->cloudinary_temp_folder = env('CLOUDINARY_VEHICLES_FOLDER_BASE', 'abcars_images');
    }

    /**
     * Execute the job.
     */
    public function handle(Cloudinary $cloudinary): void
    {
        $this->validateInputs();

        try {
            Log::info('Uploading image for vehicle (Cloudinary → S3 → CloudFront)', [
                'vehicle_id' => $this->vehicle_id,
                'vehicle_uuid' => $this->vehicle_uuid,
                'path' => $this->path,
                'sort_id' => $this->sort_id,
            ]);

            $name = time().'_'.$this->sort_id;

            $cloudinary_file = $cloudinary->uploadApi()->upload(storage_path('app/' . $this->path), [
                'public_id' => $name,
                'folder' => $this->cloudinary_temp_folder . '/' . $this->vehicle_uuid,
                'transformation' => CloudinaryVehicleUploadTransform::incomingFlattenTransformation(),
            ]);

            $cloudinary_url = $cloudinary_file['secure_url'];
            $cloudinary_public_id = $cloudinary_file['public_id'] ?? null;

            $s3_path = $this->base_folder . '/' . $this->vehicle_uuid . '/' . $name . '.jpg';
            $image_contents = file_get_contents($cloudinary_url);

            if ($image_contents === false) {
                throw new Exception('Failed to download optimized image from Cloudinary');
            }

            $s3_result = Storage::disk('s3')->put($s3_path, $image_contents);

            if (! $s3_result) {
                throw new Exception('Failed to upload image to S3');
            }

            $cdn_url = $this->aws_url . '/' . $s3_path;

            VehicleImage::create([
                'sort_id' => $this->sort_id,
                'image_name' => $this->original_filename,
                'vehicle_id' => $this->vehicle_id,
                // Clave S3 para hard-delete futuro; no es public_id de Cloudinary.
                'service_public_id' => $s3_path,
                'service_image_url' => $cdn_url,
            ]);

            if ($this->is_last) {
                Vehicle::where('id', $this->vehicle_id)
                    ->update(['page_status' => 'active']);
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

            Storage::delete($this->path);

            ApiResponseHelper::imageSuccess(200, 'Imagen subida correctamente al servicio externo', ['url' => $cdn_url]);

        } catch (\Exception $e) {
            ApiResponseHelper::imageError('Error en el job para subir la imagen para id: '.$this->vehicle_id, $e->getMessage(), 500, 'UPLOAD_IMAGE_ERROR');

            ApiResponseHelper::imageError('Imagen guardada localmente para vehículo uuid: '.$this->vehicle_uuid, 'Guardada en: ' . $this->path, 500, 'SAVE_LOCAL_IMAGE_ERROR');
            throw $e;
        }
    }

    /**
     * Validates the required inputs.
     */
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
            if (empty($value)) {
                throw new Exception("{$field} is required");
            }
        }
    }
}
