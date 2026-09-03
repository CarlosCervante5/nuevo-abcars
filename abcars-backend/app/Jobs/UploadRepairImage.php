<?php

namespace App\Jobs;

use App\Helpers\ApiResponseHelper;
use App\Models\Valuations\ValuationRepair;
use App\Services\LocalImageS3Uploader;
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

    public function __construct(string $path, ValuationRepair $valuation_repair, string $original_filename)
    {
        $this->path = $path;
        $this->valuation_repair = $valuation_repair;
        $this->original_filename = $original_filename;
        $this->base_folder = env('AWS_REPAIR_FOLDER_BASE', env('CLOUDINARY_REPAIR_FOLDER_BASE', 'abcars_repairs'));
    }

    public function handle(LocalImageS3Uploader $uploader): void
    {
        $this->validateInputs();

        try {
            Log::info('Uploading repair image (local optimize → S3)', [
                'repair_uuid' => $this->valuation_repair->uuid,
                'path' => $this->path,
            ]);

            $name = time().'_'.$this->valuation_repair->uuid;
            $s3Path = $this->base_folder.'/'.$this->valuation_repair->uuid.'/'.$name.'.jpg';
            $uploaded = $uploader->putJpeg($this->path, $s3Path);

            $this->valuation_repair->update(['image_path' => $uploaded['url']]);
            Storage::delete($this->path);

            Log::info('Repair image uploaded to S3/CloudFront', [
                'repair_uuid' => $this->valuation_repair->uuid,
            ]);

            ApiResponseHelper::imageSuccess(200, 'Imagen subida correctamente al servicio externo', ['url' => $uploaded['url']]);
        } catch (Exception $e) {
            Log::error('Error uploading repair image:', ['exception' => $e->getMessage()]);
            ApiResponseHelper::imageError(
                'Error en el job para subir la imagen de reparación (uuid: '.$this->valuation_repair->uuid.')',
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
