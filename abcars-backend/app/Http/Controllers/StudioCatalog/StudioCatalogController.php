<?php

namespace App\Http\Controllers\StudioCatalog;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Models\StudioCatalogSetting;
use Cloudinary\Cloudinary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StudioCatalogController extends Controller
{
    public function showBackground(): JsonResponse
    {
        return ApiResponseHelper::apiSuccess(
            200,
            'Fondo de ciclorama de catálogo',
            StudioCatalogSetting::current()->toPublicArray()
        );
    }

    public function storeBackground(Request $request, Cloudinary $cloudinary): JsonResponse
    {
        $validated = $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,webp|max:8192',
            'width' => 'nullable|integer|min:640|max:4096',
            'height' => 'nullable|integer|min:480|max:4096',
        ]);

        $settings = StudioCatalogSetting::current();
        $path = $validated['image']->store('temp_images');

        try {
            $folder = env('CLOUDINARY_STUDIO_FOLDER', 'abcars_studio');
            $upload = $cloudinary->uploadApi()->upload(storage_path('app/' . $path), [
                'public_id' => 'cyclorama-master-' . time(),
                'folder' => $folder,
                'overwrite' => true,
                'resource_type' => 'image',
                'format' => 'jpg',
                'transformation' => [
                    'quality' => 'auto:good',
                    'fetch_format' => 'jpg',
                ],
            ]);

            if (filled($settings->cyclorama_public_id)) {
                try {
                    $cloudinary->uploadApi()->destroy($settings->cyclorama_public_id);
                } catch (\Throwable) {
                    // No bloquear si el asset anterior ya no existe.
                }
            }

            $settings->cyclorama_image_url = $upload['secure_url'] ?? null;
            $settings->cyclorama_public_id = $upload['public_id'] ?? null;
            $settings->width = (int) ($validated['width'] ?? StudioCatalogSetting::DEFAULT_WIDTH);
            $settings->height = (int) ($validated['height'] ?? StudioCatalogSetting::DEFAULT_HEIGHT);
            $settings->save();

            return ApiResponseHelper::apiSuccess(
                200,
                'Ciclorama maestro guardado',
                $settings->fresh()->toPublicArray()
            );
        } finally {
            Storage::delete($path);
        }
    }

    public function resetBackground(Cloudinary $cloudinary): JsonResponse
    {
        $settings = StudioCatalogSetting::current();

        if (filled($settings->cyclorama_public_id)) {
            try {
                $cloudinary->uploadApi()->destroy($settings->cyclorama_public_id);
            } catch (\Throwable) {
                // Continuar aunque falle el borrado remoto.
            }
        }

        $settings->cyclorama_image_url = null;
        $settings->cyclorama_public_id = null;
        $settings->width = StudioCatalogSetting::DEFAULT_WIDTH;
        $settings->height = StudioCatalogSetting::DEFAULT_HEIGHT;
        $settings->save();

        return ApiResponseHelper::apiSuccess(
            200,
            'Se restauró el ciclorama por defecto (plantilla SVG)',
            $settings->fresh()->toPublicArray()
        );
    }
}
