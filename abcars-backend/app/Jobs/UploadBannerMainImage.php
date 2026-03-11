<?php

namespace App\Jobs;

use App\Helpers\ApiResponseHelper;
use App\Models\MarketingCampaign;
use Cloudinary\Cloudinary;
use Exception;
use Illuminate\Bus\Queueable;
// use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

// class UploadBannerMainImage implements ShouldQueue
class UploadBannerMainImage
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $path;
    protected $main_banner;
    protected $original_filename;
    protected $base_folder;

    /**
     * Create a new job instance.
     */
    public function __construct( String $path, MarketingCampaign $main_banner, String $original_filename)
    {
        $this->path = $path;
        $this->main_banner = $main_banner;
        $this->original_filename = $original_filename;
        $this->base_folder = env('CLOUDINARY_MAIN_BANNER_FOLDER_BASE', 'abcars_images');
    }

    /**
     * Execute the job.
     */
    public function handle(Cloudinary $cloudinary): void
    {
        // Validaciones
        $this->validateInputs();

        try {
            
            Log::info('Main image details:', [
                'marketing_campaign_uuid' => $this->main_banner->uuid,
                'path' => $this->path
            ]);

            $name = time().'_'.$this->main_banner->uuid;

            $cloudinary_file = $cloudinary->uploadApi()->upload(storage_path('app/' . $this->path), [
                'public_id' => $name,
                'folder' => $this->base_folder . '/' . $this->main_banner->uuid,
                'transformation' => [
                    'quality' => 'auto',
                    'fetch_format' => 'jpg'
                ]
            ]);

            $cloudinary_url = $cloudinary_file['secure_url'];

            $this->main_banner->update(['image_path' => $cloudinary_url]);

            Storage::delete($this->path);

            ApiResponseHelper::imageSuccess(200, 'Imagen subida correctamente al servicio externo', ['url' => $cloudinary_url]);

        } catch (\Exception $e) {
            
            ApiResponseHelper::imageError('Error en el job para subir la imagen para uuid: '.$this->main_banner->uuid, $e->getMessage(), 500, 'UPLOAD_IMAGE_ERROR');

            ApiResponseHelper::imageError('imagen guardada localmente para el post uuid: '.$this->main_banner->uuid, 'Guardada en: ' . $this->path, 500, 'SAVE_LOCAL_IMAGE_ERROR');
        }
    }

    /**
     * Validates the required inputs.
     */
    protected function validateInputs(): void
    {
        $requiredFields = [
            'path' => $this->path,
            'main_banner' => $this->main_banner,
            'original_filename' => $this->original_filename
        ];

        foreach ($requiredFields as $field => $value) {
            if (empty($value)) {
                throw new Exception("{$field} is required");
            }
        }
    }
}
