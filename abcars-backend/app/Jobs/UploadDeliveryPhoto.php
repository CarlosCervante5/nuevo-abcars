<?php

namespace App\Jobs;

use App\Models\DeliveryPhoto;
use Cloudinary\Cloudinary;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UploadDeliveryPhoto
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected string $path;
    protected ?string $caption;
    protected int $sortOrder;
    protected string $originalFilename;

    public function __construct(string $path, ?string $caption, int $sortOrder, string $originalFilename)
    {
        $this->path = $path;
        $this->caption = $caption;
        $this->sortOrder = $sortOrder;
        $this->originalFilename = $originalFilename;
    }

    public function handle(Cloudinary $cloudinary): void
    {
        $this->validateInputs();

        try {
            $baseFolder = env('CLOUDINARY_DELIVERY_PHOTOS_FOLDER_BASE', 'abcars_images/delivery_photos');
            $name = 'delivery_' . time() . '_' . uniqid();

            $cloudinaryFile = $cloudinary->uploadApi()->upload(storage_path('app/' . $this->path), [
                'public_id' => $name,
                'folder' => $baseFolder,
                'transformation' => [
                    'quality' => 'auto',
                    'fetch_format' => 'jpg'
                ]
            ]);

            $cloudinaryUrl = $cloudinaryFile['secure_url'];
            $publicId = $cloudinaryFile['public_id'] ?? null;

            DeliveryPhoto::create([
                'service_image_url' => $cloudinaryUrl,
                'service_public_id' => $publicId,
                'caption' => $this->caption,
                'sort_order' => $this->sortOrder,
            ]);

            Storage::delete($this->path);

            Log::info('Delivery photo uploaded', ['url' => $cloudinaryUrl]);
        } catch (\Exception $e) {
            Log::error('Error uploading delivery photo', ['error' => $e->getMessage()]);
            Storage::delete($this->path);
            throw $e;
        }
    }

    protected function validateInputs(): void
    {
        if (empty($this->path)) {
            throw new Exception('path is required');
        }
    }
}
