<?php

namespace App\Jobs;

use App\Helpers\ApiResponseHelper;
use App\Models\PostContent;
use App\Services\LocalImageS3Uploader;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UploadPostContentImage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $path;
    protected $content;
    protected $original_filename;
    protected $field;
    protected $base_folder;
    public $tries = 5;
    public $backoff = 60;

    public function __construct(String $path, PostContent $content, String $original_filename, String $field)
    {
        $this->path = $path;
        $this->content = $content;
        $this->field = $field;
        $this->original_filename = $original_filename;
        $this->base_folder = env('AWS_POST_CONTENT_FOLDER_BASE', 'abcars_post_content');
    }

    public function handle(LocalImageS3Uploader $uploader): void
    {
        $this->validateInputs();

        try {
            Log::info('Uploading post content image (local optimize → S3)', [
                'content_uuid' => $this->content->uuid,
                'path' => $this->path,
            ]);

            $name = time().'_'.$this->content->uuid;
            $s3Path = $this->base_folder.'/'.$name.'.jpg';
            $uploaded = $uploader->putJpeg($this->path, $s3Path);

            $this->content->update([$this->field => $uploaded['url']]);
            Storage::delete($this->path);

            ApiResponseHelper::imageSuccess(200, 'Imagen subida correctamente al servicio externo', ['url' => $uploaded['url']]);
        } catch (\Exception $e) {
            ApiResponseHelper::imageError('Error en el job para subir la imagen para uuid: '.$this->content->uuid, $e->getMessage(), 500, 'UPLOAD_IMAGE_ERROR');
            ApiResponseHelper::imageError('Imagen guardada localmente para el contenido uuid: '.$this->content->uuid, 'Guardada en: '.$this->path, 500, 'SAVE_LOCAL_IMAGE_ERROR');
            throw $e;
        }
    }

    protected function validateInputs(): void
    {
        $requiredFields = [
            'path' => $this->path,
            'content' => $this->content,
            'original_filename' => $this->original_filename,
        ];

        foreach ($requiredFields as $field => $value) {
            if (empty($value)) {
                throw new Exception("{$field} is required");
            }
        }
    }
}
