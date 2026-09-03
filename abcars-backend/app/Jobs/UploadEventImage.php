<?php

namespace App\Jobs;

use App\Helpers\ApiResponseHelper;
use App\Models\MarketingEvent;
use App\Services\LocalImageS3Uploader;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UploadEventImage
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $path;
    protected $event;
    protected $original_filename;
    protected $base_folder;

    public function __construct(String $path, MarketingEvent $event, String $original_filename)
    {
        $this->path = $path;
        $this->event = $event;
        $this->original_filename = $original_filename;
        $this->base_folder = env('AWS_EVENT_FOLDER_BASE', 'abcars_eventos');
    }

    public function handle(LocalImageS3Uploader $uploader): void
    {
        $this->validateInputs();

        try {
            Log::info('Uploading event image (local optimize → S3)', [
                'event_uuid' => $this->event->uuid,
                'path' => $this->path,
            ]);

            $name = time().'_'.$this->event->uuid;
            $s3Path = $this->base_folder.'/'.$this->event->uuid.'/'.$name.'.jpg';
            $uploaded = $uploader->putJpeg($this->path, $s3Path);

            $this->event->update(['image_path' => $uploaded['url']]);
            Storage::delete($this->path);

            ApiResponseHelper::imageSuccess(200, 'Imagen subida correctamente al servicio externo', ['url' => $uploaded['url']]);
        } catch (\Exception $e) {
            ApiResponseHelper::imageError('Error en el job para subir la imagen para uuid: '.$this->event->uuid, $e->getMessage(), 500, 'UPLOAD_IMAGE_ERROR');
            ApiResponseHelper::imageError('Imagen guardada localmente para evento uuid: '.$this->event->uuid, 'Guardada en: '.$this->path, 500, 'SAVE_LOCAL_IMAGE_ERROR');
        }
    }

    protected function validateInputs(): void
    {
        $requiredFields = [
            'path' => $this->path,
            'event' => $this->event,
            'original_filename' => $this->original_filename,
        ];

        foreach ($requiredFields as $field => $value) {
            if (empty($value)) {
                throw new Exception("{$field} is required");
            }
        }
    }
}
