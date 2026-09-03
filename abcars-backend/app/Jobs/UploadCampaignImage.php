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

class UploadCampaignImage
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $path;
    protected $campaign;
    protected $original_filename;
    protected $base_folder;

    public function __construct(String $path, MarketingCampaign $campaign, String $original_filename)
    {
        $this->path = $path;
        $this->campaign = $campaign;
        $this->original_filename = $original_filename;
        $this->base_folder = env('AWS_CAMPAIGN_FOLDER_BASE', 'abcars_campañas');
    }

    public function handle(LocalImageS3Uploader $uploader): void
    {
        $this->validateInputs();

        try {
            Log::info('Uploading campaign image (local optimize → S3)', [
                'campaign_uuid' => $this->campaign->uuid,
                'path' => $this->path,
            ]);

            $name = time().'_'.$this->campaign->uuid;
            $s3Path = $this->base_folder.'/'.$this->campaign->uuid.'/'.$name.'.jpg';
            $uploaded = $uploader->putJpeg($this->path, $s3Path);

            $this->campaign->update(['image_path' => $uploaded['url']]);
            Storage::delete($this->path);

            ApiResponseHelper::imageSuccess(200, 'Imagen subida correctamente al servicio externo', ['url' => $uploaded['url']]);
        } catch (\Exception $e) {
            ApiResponseHelper::imageError('Error en el job para subir la imagen para uuid: '.$this->campaign->uuid, $e->getMessage(), 500, 'UPLOAD_IMAGE_ERROR');
            ApiResponseHelper::imageError('Imagen guardada localmente para campaña uuid: '.$this->campaign->uuid, 'Guardada en: '.$this->path, 500, 'SAVE_LOCAL_IMAGE_ERROR');
        }
    }

    protected function validateInputs(): void
    {
        $requiredFields = [
            'path' => $this->path,
            'campaign' => $this->campaign,
            'original_filename' => $this->original_filename,
        ];

        foreach ($requiredFields as $field => $value) {
            if (empty($value)) {
                throw new Exception("{$field} is required");
            }
        }
    }
}
