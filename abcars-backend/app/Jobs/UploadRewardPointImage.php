<?php

namespace App\Jobs;

use App\Helpers\ApiResponseHelper;
use App\Models\PointImage;
use App\Models\RewardPoint;
use App\Services\LocalImageS3Uploader;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UploadRewardPointImage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $path;
    protected $name;
    protected $reward_point;
    protected $original_filename;
    protected $base_folder;
    public $tries = 5;
    public $backoff = 60;

    public function __construct(String $path, String $name, RewardPoint $reward_point, String $original_filename)
    {
        $this->path = $path;
        $this->name = $name;
        $this->reward_point = $reward_point;
        $this->original_filename = $original_filename;
        $this->base_folder = env('AWS_REWARD_POINTS_FOLDER_BASE', 'abcars_puntos_rewards');
    }

    public function handle(LocalImageS3Uploader $uploader): void
    {
        $this->validateInputs();

        try {
            Log::info('Uploading reward point image (local optimize → S3)', [
                'reward_uuid' => $this->reward_point->uuid,
                'path' => $this->path,
            ]);

            $name = time().'_'.$this->reward_point->uuid;
            $s3Path = $this->base_folder.'/'.$this->reward_point->uuid.'/'.$name.'.jpg';
            $uploaded = $uploader->putJpeg($this->path, $s3Path);

            $point_image = PointImage::where(['name' => $this->name, 'point_id' => $this->reward_point->id])->first();

            if (! $point_image) {
                PointImage::create([
                    'name' => $this->name,
                    'point_id' => $this->reward_point->id,
                    'image_path' => $uploaded['url'],
                ]);
            } else {
                $point_image->update([
                    'image_path' => $uploaded['url'],
                ]);
            }

            Storage::delete($this->path);

            ApiResponseHelper::imageSuccess(200, 'Imagen subida correctamente al servicio externo', ['url' => $uploaded['url']]);
        } catch (\Exception $e) {
            ApiResponseHelper::imageError('Error en el job para subir la imagen para uuid: '.$this->reward_point->uuid, $e->getMessage(), 500, 'UPLOAD_IMAGE_ERROR');
            ApiResponseHelper::imageError('Imagen guardada localmente para reward point uuid: '.$this->reward_point->uuid, 'Guardada en: '.$this->path, 500, 'SAVE_LOCAL_IMAGE_ERROR');
            throw $e;
        }
    }

    protected function validateInputs(): void
    {
        $requiredFields = [
            'path' => $this->path,
            'name' => $this->name,
            'reward_point' => $this->reward_point,
            'original_filename' => $this->original_filename,
        ];

        foreach ($requiredFields as $field => $value) {
            if (empty($value)) {
                throw new Exception("{$field} is required");
            }
        }
    }
}
