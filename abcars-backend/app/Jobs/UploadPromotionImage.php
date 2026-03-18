<?php

namespace App\Jobs;

use App\Helpers\ApiResponseHelper;
use App\Models\MarketingCampaign;
use App\Models\MarketingPromotion;
use Cloudinary\Cloudinary;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UploadPromotionImage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $path;
    protected $promotion_name;
    protected $campaign_uuid;
    protected $sort_id;
    protected $original_filename;
    protected $spec_sheet;
    public $tries = 5;
    public $backoff = 60;
    protected $base_folder;

    /**
     * Create a new job instance.
     */
    public function __construct(string $path, string $promotion_name, string $campaign_uuid, int $index, string $original_filename, string $spec_sheet)
    {
        $this->path = $path;
        $this->promotion_name = $promotion_name;
        $this->spec_sheet = $spec_sheet;
        $this->campaign_uuid = $campaign_uuid;
        $this->sort_id = $index;
        $this->original_filename = $original_filename;
        $this->base_folder = env('CLOUDINARY_PROMOTION_FOLDER_BASE', 'abcars_promociones');
    }

    /**
     * Execute the job.
     */
    public function handle(Cloudinary $cloudinary): void
    {
        $this->validateInputs();

        try {
            $campaign = MarketingCampaign::findByUuid($this->campaign_uuid);

            if (!$campaign) {
                Log::error('Campaign not found for UUID: ' . $this->campaign_uuid);
                return;
            }

            $name = time() . '_' . $this->sort_id;

            $localPath = storage_path('app/' . $this->path);
            Log::channel('stderr')->error('Promotion image upload starting', [
                'campaign_uuid' => $campaign->uuid,
                'local_path' => $localPath,
                'exists' => file_exists($localPath),
                'size' => file_exists($localPath) ? filesize($localPath) : null,
                'base_folder' => $this->base_folder,
            ]);

            $cloudinary_file = $cloudinary->uploadApi()->upload($localPath, [
                'public_id' => $name,
                'folder' => $this->base_folder . '/' . $campaign->uuid,
                'transformation' => [
                    'quality' => 'auto',
                    'fetch_format' => 'jpg',
                ],
            ]);

            $cloudinary_url = $cloudinary_file['secure_url'];
            Log::channel('stderr')->error('Promotion image uploaded to Cloudinary (raw)', [
                'secure_url' => $cloudinary_file['secure_url'] ?? null,
                'public_id' => $cloudinary_file['public_id'] ?? null,
                'folder' => $this->base_folder . '/' . $campaign->uuid,
            ]);

            $promotion = MarketingPromotion::create([
                'sort_id' => $this->sort_id,
                'name' => $this->promotion_name,
                'spec_sheet' => $this->spec_sheet,
                'image_path' => $cloudinary_url,
            ]);

            $campaign->promotions()->attach($promotion->id);

            Storage::delete($this->path);

            Log::info('Promotion image uploaded to Cloudinary:', [
                'promotion_id' => $promotion->id,
                'campaign_id' => $campaign->id,
            ]);

            ApiResponseHelper::imageSuccess(200, 'Imagen subida correctamente al servicio externo', ['url' => $cloudinary_url]);
        } catch (Exception $e) {
            Log::channel('stderr')->error('Error uploading promotion image:', [
                'exception' => $e->getMessage(),
                'exception_class' => get_class($e),
            ]);

            // Importante: no silencie errores. Si falla el upload, el controlador debe recibirlo
            // (especialmente en Railway cuando usamos dispatchSync para diagnosticar).
            throw $e;
        }
    }

    protected function validateInputs(): void
    {
        $requiredFields = [
            'path' => $this->path,
            'campaign_uuid' => $this->campaign_uuid,
            'sort_id' => $this->sort_id,
            'original_filename' => $this->original_filename,
        ];

        foreach ($requiredFields as $field => $value) {
            if ($value === null || $value === '') {
                throw new Exception("{$field} is required");
            }
        }
    }
}
