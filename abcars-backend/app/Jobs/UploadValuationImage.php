<?php

namespace App\Jobs;

use App\Helpers\ApiResponseHelper;
use App\Models\Valuations\ValuationImage;
use App\Services\LocalImageS3Uploader;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadValuationImage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $path;
    protected $valuation_id;
    protected $valuation_uuid;
    protected $sort_id;
    protected $original_filename;
    protected $name;
    protected $group_name;
    public $tries = 5;
    public $backoff = 60;
    protected $base_folder;

    public function __construct(string $path, string $valuation_uuid, int $valuation_id, int $index, string $original_filename, string $name, string $group_name)
    {
        $this->path = $path;
        $this->valuation_uuid = $valuation_uuid;
        $this->valuation_id = $valuation_id;
        $this->sort_id = $index;
        $this->original_filename = $original_filename;
        $this->name = $name;
        $this->group_name = $group_name;
        $this->base_folder = env('AWS_VALUATIONS_FOLDER_BASE', env('CLOUDINARY_VALUATIONS_FOLDER_BASE', 'abcars_valuations'));
    }

    public function handle(LocalImageS3Uploader $uploader): void
    {
        $this->validateInputs();

        try {
            Log::info('Uploading valuation image (local optimize → S3)', [
                'valuation_id' => $this->valuation_id,
                'valuation_uuid' => $this->valuation_uuid,
                'path' => $this->path,
                'sort_id' => $this->sort_id,
            ]);

            $name = time().'_'.$this->sort_id.'_'.Str::lower(Str::random(8));
            $s3Path = $this->base_folder.'/'.$this->valuation_uuid.'/'.$name.'.jpg';
            $uploaded = $uploader->putJpeg($this->path, $s3Path);

            $groupLower = strtolower($this->group_name);
            if ($groupLower === 'interior' || $groupLower === 'exterior') {
                ValuationImage::where('name', $this->name)
                    ->where('group_name', $groupLower)
                    ->where('valuation_id', $this->valuation_id)
                    ->delete();
            }

            ValuationImage::create([
                'sort_id' => $this->sort_id,
                'name' => $this->name,
                'group_name' => $groupLower,
                'image_path' => $uploaded['url'],
                'valuation_id' => $this->valuation_id,
            ]);

            Storage::delete($this->path);

            Log::info('Valuation image uploaded to S3/CloudFront', [
                'valuation_id' => $this->valuation_id,
            ]);

            ApiResponseHelper::imageSuccess(200, 'Imagen subida correctamente al servicio externo.', ['url' => $uploaded['url']]);
        } catch (Exception $e) {
            Log::error('Error uploading valuation image:', ['exception' => $e->getMessage()]);
            ApiResponseHelper::imageError(
                'Error en el job para subir la imagen de valuación (id: '.$this->valuation_id.')',
                $e->getMessage(),
                500,
                'UPLOAD_IMAGE_ERROR'
            );
            throw $e;
        }
    }

    protected function validateInputs(): void
    {
        $requiredFields = [
            'path' => $this->path,
            'valuation_uuid' => $this->valuation_uuid,
            'valuation_id' => $this->valuation_id,
            'sort_id' => $this->sort_id,
            'original_filename' => $this->original_filename,
            'name' => $this->name,
            'group_name' => $this->group_name,
        ];

        foreach ($requiredFields as $field => $value) {
            if ($value === null || $value === '') {
                throw new Exception("{$field} is required");
            }
        }
    }
}
