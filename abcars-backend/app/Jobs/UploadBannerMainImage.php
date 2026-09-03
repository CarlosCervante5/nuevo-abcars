<?php

namespace App\Jobs;

use App\Helpers\ApiResponseHelper;
use App\Models\MarketingCampaign;
use App\Services\LocalImageS3Uploader;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UploadBannerMainImage
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $path;
    protected $main_banner;
    protected $original_filename;
    protected $base_folder;

    public function __construct(String $path, MarketingCampaign $main_banner, String $original_filename)
    {
        $this->path = $path;
        $this->main_banner = $main_banner;
        $this->original_filename = $original_filename;
        $this->base_folder = env('AWS_MAIN_BANNER_FOLDER_BASE', env('CLOUDINARY_MAIN_BANNER_FOLDER_BASE', 'abcars_images'));
    }

    public function handle(LocalImageS3Uploader $uploader): void
    {
        $this->validateInputs();

        try {
            Log::info('Uploading main banner image (local optimize → S3)', [
                'marketing_campaign_uuid' => $this->main_banner->uuid,
                'path' => $this->path,
            ]);

            $name = time().'_'.$this->main_banner->uuid;
            $s3Path = $this->base_folder.'/'.$this->main_banner->uuid.'/'.$name.'.jpg';
            $uploaded = $uploader->putJpeg($this->path, $s3Path);

            $this->main_banner->update(['image_path' => $uploaded['url']]);
            Storage::delete($this->path);

            ApiResponseHelper::imageSuccess(200, 'Imagen subida correctamente al servicio externo', ['url' => $uploaded['url']]);
        } catch (\Exception $e) {
            ApiResponseHelper::imageError('Error en el job para subir la imagen para uuid: '.$this->main_banner->uuid, $e->getMessage(), 500, 'UPLOAD_IMAGE_ERROR');
            ApiResponseHelper::imageError('imagen guardada localmente para el post uuid: '.$this->main_banner->uuid, 'Guardada en: '.$this->path, 500, 'SAVE_LOCAL_IMAGE_ERROR');
        }
    }

    protected function validateInputs(): void
    {
        $requiredFields = [
            'path' => $this->path,
            'main_banner' => $this->main_banner,
            'original_filename' => $this->original_filename,
        ];

        foreach ($requiredFields as $field => $value) {
            if (empty($value)) {
                throw new Exception("{$field} is required");
            }
        }
    }
}
