<?php

namespace App\Jobs;

use App\Helpers\ApiResponseHelper;
use App\Models\Quiz;
use App\Services\LocalImageS3Uploader;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UploadQuizImage
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $path;
    protected $quiz;
    protected $original_filename;
    protected $base_folder;

    public function __construct(String $path, Quiz $quiz, String $original_filename)
    {
        $this->path = $path;
        $this->quiz = $quiz;
        $this->original_filename = $original_filename;
        $this->base_folder = env('AWS_QUIZZES_FOLDER_BASE', 'abcars_quizzes');
    }

    public function handle(LocalImageS3Uploader $uploader): void
    {
        $this->validateInputs();

        try {
            Log::info('Uploading quiz image (local optimize → S3)', [
                'quiz_uuid' => $this->quiz->uuid,
                'path' => $this->path,
            ]);

            $name = time().'_'.$this->quiz->uuid;
            $s3Path = $this->base_folder.'/'.$this->quiz->uuid.'/'.$name.'.jpg';
            $uploaded = $uploader->putJpeg($this->path, $s3Path);

            $this->quiz->update(['image_path' => $uploaded['url']]);
            Storage::delete($this->path);

            ApiResponseHelper::imageSuccess(200, 'Imagen subida correctamente al servicio externo', ['url' => $uploaded['url']]);
        } catch (\Exception $e) {
            ApiResponseHelper::imageError('Error en el job para subir la imagen para uuid: '.$this->quiz->uuid, $e->getMessage(), 500, 'UPLOAD_IMAGE_ERROR');
            ApiResponseHelper::imageError('Imagen guardada localmente para quiz uuid: '.$this->quiz->uuid, 'Guardada en: '.$this->path, 500, 'SAVE_LOCAL_IMAGE_ERROR');
        }
    }

    protected function validateInputs(): void
    {
        $requiredFields = [
            'path' => $this->path,
            'event' => $this->quiz,
            'original_filename' => $this->original_filename,
        ];

        foreach ($requiredFields as $field => $value) {
            if (empty($value)) {
                throw new Exception("{$field} is required");
            }
        }
    }
}
