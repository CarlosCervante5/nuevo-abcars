<?php

namespace App\Jobs;

use App\Helpers\ApiResponseHelper;
use App\Models\EventMultimedia;
use App\Models\MarketingEvent;
use App\Services\LocalImageS3Uploader;
use Cloudinary\Cloudinary;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UploadEventMultimedia implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $path;
    protected $event_uuid;
    protected $sort_id;
    protected $original_filename;
    protected $mimeType;
    public $tries = 5;
    public $backoff = 60;
    protected $base_folder;

    public function __construct(String $path, String $event_uuid, int $index, String $original_filename, String $mimeType)
    {
        $this->path = $path;
        $this->event_uuid = $event_uuid;
        $this->sort_id = $index;
        $this->original_filename = $original_filename;
        $this->mimeType = $mimeType;
        $this->base_folder = env('AWS_EVENT_MULTIMEDIA_FOLDER_BASE', 'abcars_multimedia');
    }

    public function handle(LocalImageS3Uploader $uploader, Cloudinary $cloudinary): void
    {
        $this->validateInputs();

        try {
            $event = MarketingEvent::findByUuid($this->event_uuid);

            if (! $event) {
                Log::error('Event not found for UUID: '.$this->event_uuid);

                return;
            }

            Log::info('Uploading event multimedia', [
                'event_id' => $event->id,
                'event_uuid' => $event->uuid,
                'path' => $this->path,
                'sort_id' => $this->sort_id,
                'mime' => $this->mimeType,
            ]);

            $name = time().'_'.$this->sort_id;

            if (strstr($this->mimeType, 'image/')) {
                $s3Path = $this->base_folder.'/'.$event->uuid.'/'.$name.'.jpg';
                $uploaded = $uploader->putJpeg($this->path, $s3Path);
                $cdnUrl = $uploaded['url'];
            } elseif (strstr($this->mimeType, 'video/')) {
                $cloudinaryFile = $cloudinary->uploadApi()->upload(storage_path('app/'.$this->path), [
                    'resource_type' => 'video',
                    'public_id' => $name,
                    'folder' => $this->base_folder.'/'.$event->uuid,
                    'transformation' => [
                        'quality' => 'auto',
                        'fetch_format' => 'auto',
                    ],
                ]);

                $ext = pathinfo($this->original_filename, PATHINFO_EXTENSION) ?: 'mp4';
                $s3Path = $this->base_folder.'/'.$event->uuid.'/'.$name.'.'.$ext;
                $contents = file_get_contents($cloudinaryFile['secure_url']);
                if ($contents === false) {
                    throw new Exception('Failed to download optimized video from Cloudinary');
                }
                $cdnUrl = $uploader->putBinary($s3Path, $contents);
                try {
                    $cloudinary->uploadApi()->destroy($cloudinaryFile['public_id'], ['resource_type' => 'video']);
                } catch (\Throwable $e) {
                    Log::warning('No se pudo borrar video temporal Cloudinary', ['message' => $e->getMessage()]);
                }
            } else {
                throw new Exception('Unsupported file type');
            }

            $multimedia = EventMultimedia::create([
                'event_id' => $event->id,
                'sort_id' => $this->sort_id,
                'multimedia_path' => $cdnUrl,
            ]);

            Storage::delete($this->path);

            Log::info('Multimedia associated successfully:', [
                'multimedia_id' => $multimedia->id,
                'event_id' => $event->id,
                'multimedia_path' => $multimedia->multimedia_path,
            ]);

            ApiResponseHelper::imageSuccess(200, 'Multimedia subida correctamente al servicio externo', ['url' => $cdnUrl]);
        } catch (Exception $e) {
            Log::error('Error uploading image:', ['exception' => $e->getMessage()]);
            ApiResponseHelper::imageError('Error en el job para subir el multimedia para id: '.$this->event_uuid, $e->getMessage(), 500, 'UPLOAD_MULTIMEDIA_ERROR');
            throw $e;
        }
    }

    protected function validateInputs(): void
    {
        $requiredFields = [
            'path' => $this->path,
            'event_uuid' => $this->event_uuid,
            'sort_id' => $this->sort_id,
            'original_filename' => $this->original_filename,
        ];

        foreach ($requiredFields as $field => $value) {
            if (empty($value)) {
                throw new Exception("{$field} is required");
            }
        }
    }
}
