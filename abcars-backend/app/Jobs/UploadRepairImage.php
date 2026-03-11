<?php

namespace App\Jobs;

use App\Helpers\ApiResponseHelper;
use App\Models\Valuations\ValuationRepair;
use Cloudinary\Cloudinary;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UploadRepairImage
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $path;
    protected $valuation_repair;
    protected $original_filename;
    protected $base_folder;

    /**
     * Create a new job instance.
     */
    public function __construct(string $path, ValuationRepair $valuation_repair, string $original_filename)
    {
        $this->path = $path;
        $this->valuation_repair = $valuation_repair;
        $this->original_filename = $original_filename;
        $this->base_folder = env('CLOUDINARY_REPAIR_FOLDER_BASE', 'abcars_repairs');
    }

    /**
     * Execute the job.
     */
    public function handle(Cloudinary $cloudinary): void
    {
        $this->validateInputs();

        try {
            Log::info('Repair image job:', [
                'repair_uuid' => $this->valuation_repair->uuid,
                'path' => $this->path,
            ]);

            $name = time() . '_' . $this->valuation_repair->uuid;

            $cloudinary_file = $cloudinary->uploadApi()->upload(storage_path('app/' . $this->path), [
                'public_id' => $name,
                'folder' => $this->base_folder . '/' . $this->valuation_repair->uuid,
                'transformation' => [
                    'quality' => 'auto',
                    'fetch_format' => 'jpg',
                ],
            ]);

            $cloudinary_url = $cloudinary_file['secure_url'];

            $this->valuation_repair->update(['image_path' => $cloudinary_url]);

            Storage::delete($this->path);

            Log::info('Repair image uploaded to Cloudinary:', [
                'repair_uuid' => $this->valuation_repair->uuid,
            ]);

            ApiResponseHelper::imageSuccess(200, 'Imagen subida correctamente al servicio externo', ['url' => $cloudinary_url]);
        } catch (Exception $e) {
            Log::error('Error uploading repair image:', ['exception' => $e->getMessage()]);
            ApiResponseHelper::imageError(
                'Error en el job para subir la imagen de reparación (uuid: ' . $this->valuation_repair->uuid . ')',
                $e->getMessage(),
                500,
                'UPLOAD_IMAGE_ERROR'
            );
        }
    }

    protected function validateInputs(): void
    {
        $requiredFields = [
            'path' => $this->path,
            'valuation_repair' => $this->valuation_repair,
            'original_filename' => $this->original_filename,
        ];

        foreach ($requiredFields as $field => $value) {
            if (empty($value)) {
                throw new Exception("{$field} is required");
            }
        }
    }
}
