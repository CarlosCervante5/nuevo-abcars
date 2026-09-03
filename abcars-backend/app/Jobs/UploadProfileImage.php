<?php

namespace App\Jobs;

use App\Helpers\ApiResponseHelper;
use App\Models\User;
use App\Services\LocalImageS3Uploader;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UploadProfileImage
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $path;
    protected $user;
    protected $original_filename;
    protected $base_folder;

    public function __construct(String $path, User $user, String $original_filename)
    {
        $this->path = $path;
        $this->user = $user;
        $this->original_filename = $original_filename;
        $this->base_folder = env('AWS_PROFILE_FOLDER_BASE', 'abcars_perfiles');
    }

    public function handle(LocalImageS3Uploader $uploader): void
    {
        $this->validateInputs();

        try {
            Log::info('Uploading profile image (local optimize → S3)', [
                'user_uuid' => $this->user->uuid,
                'path' => $this->path,
            ]);

            $name = time().'_'.$this->user->uuid;
            $s3Path = $this->base_folder.'/'.$this->user->uuid.'/'.$name.'.jpg';
            $uploaded = $uploader->putJpeg($this->path, $s3Path);

            $profile = $this->user->getRoleProfile();
            $profile['profile']->picture = $uploaded['url'];
            $profile['profile']->save();

            Storage::delete($this->path);

            ApiResponseHelper::imageSuccess(200, 'Imagen subida correctamente al servicio externo', ['url' => $uploaded['url']]);
        } catch (\Exception $e) {
            ApiResponseHelper::imageError('Error en el job para subir la imagen para uuid: '.$this->user->uuid, $e->getMessage(), 500, 'UPLOAD_IMAGE_ERROR');
            ApiResponseHelper::imageError('Imagen guardada localmente para usuario uuid: '.$this->user->uuid, 'Guardada en: '.$this->path, 500, 'SAVE_LOCAL_IMAGE_ERROR');
        }
    }

    protected function validateInputs(): void
    {
        $requiredFields = [
            'path' => $this->path,
            'user' => $this->user,
            'original_filename' => $this->original_filename,
        ];

        foreach ($requiredFields as $field => $value) {
            if (empty($value)) {
                throw new Exception("{$field} is required");
            }
        }
    }
}
