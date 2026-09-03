<?php

namespace App\Jobs;

use App\Helpers\ApiResponseHelper;
use App\Models\Reward;
use App\Services\LocalImageS3Uploader;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UploadRewardImage
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $path;
    protected $reward;
    protected $original_filename;
    protected $base_folder;

    public function __construct(String $path, Reward $reward, String $original_filename)
    {
        $this->path = $path;
        $this->reward = $reward;
        $this->original_filename = $original_filename;
        $this->base_folder = env('AWS_REWARD_FOLDER_BASE', 'abcars_rewards');
    }

    public function handle(LocalImageS3Uploader $uploader): void
    {
        $this->validateInputs();

        try {
            Log::info('Uploading reward image (local optimize → S3)', [
                'reward_uuid' => $this->reward->uuid,
                'path' => $this->path,
            ]);

            $name = time().'_'.$this->reward->uuid;
            $s3Path = $this->base_folder.'/'.$this->reward->uuid.'/'.$name.'.jpg';
            $uploaded = $uploader->putJpeg($this->path, $s3Path);

            $this->reward->update(['image_path' => $uploaded['url']]);
            Storage::delete($this->path);

            ApiResponseHelper::imageSuccess(200, 'Imagen subida correctamente al servicio externo', ['url' => $uploaded['url']]);
        } catch (\Exception $e) {
            ApiResponseHelper::imageError('Error en el job para subir la imagen para uuid: '.$this->reward->uuid, $e->getMessage(), 500, 'UPLOAD_IMAGE_ERROR');
            ApiResponseHelper::imageError('Imagen guardada localmente para campaña uuid: '.$this->reward->uuid, 'Guardada en: '.$this->path, 500, 'SAVE_LOCAL_IMAGE_ERROR');
        }
    }

    protected function validateInputs(): void
    {
        $requiredFields = [
            'path' => $this->path,
            'reward' => $this->reward,
            'original_filename' => $this->original_filename,
        ];

        foreach ($requiredFields as $field => $value) {
            if (empty($value)) {
                throw new Exception("{$field} is required");
            }
        }
    }
}
