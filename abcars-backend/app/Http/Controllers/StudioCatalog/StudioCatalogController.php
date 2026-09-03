<?php

namespace App\Http\Controllers\StudioCatalog;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Models\StudioCatalogSetting;
use App\Services\LocalImageS3Uploader;
use App\Support\VehicleGeminiRecortePrompt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
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

    public function storeBackground(Request $request, LocalImageS3Uploader $uploader): JsonResponse
    {
        $validated = $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,webp|max:8192',
            'width' => 'nullable|integer|min:640|max:4096',
            'height' => 'nullable|integer|min:480|max:4096',
        ]);

        $settings = StudioCatalogSetting::current();
        $path = $validated['image']->store('temp_images');

        try {
            $folder = env('AWS_STUDIO_FOLDER_BASE', env('CLOUDINARY_STUDIO_FOLDER', 'abcars_studio'));
            $s3Path = rtrim($folder, '/').'/cyclorama-master-'.time().'.jpg';
            $uploaded = $uploader->putJpeg($path, $s3Path);

            if (filled($settings->cyclorama_public_id) && str_contains((string) $settings->cyclorama_public_id, '/')) {
                try {
                    Storage::disk('s3')->delete($settings->cyclorama_public_id);
                } catch (\Throwable) {
                    // No bloquear si el asset anterior ya no existe.
                }
            }

            $settings->cyclorama_image_url = $uploaded['url'];
            $settings->cyclorama_public_id = $uploaded['path'];
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

    public function resetBackground(): JsonResponse
    {
        $settings = StudioCatalogSetting::current();

        if (filled($settings->cyclorama_public_id) && str_contains((string) $settings->cyclorama_public_id, '/')) {
            try {
                Storage::disk('s3')->delete($settings->cyclorama_public_id);
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

    /**
     * Indica si el servidor puede ejecutar Gemini (clave en .env), para habilitar IA en app sin VITE_GEMINI_API_KEY.
     */
    public function geminiCapabilities(): JsonResponse
    {
        $key = (string) config('services.gemini.api_key', '');

        return ApiResponseHelper::apiSuccess(200, 'Capacidades IA', [
            'server_gemini' => $key !== '',
        ]);
    }

    /**
     * Recorte + ciclorama vía Gemini en el servidor (JSON base64; evita CORS/multipart en Capacitor).
     */
    public function geminiGenerateRecorte(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mime' => 'required|string|in:image/jpeg,image/jpg,image/png,image/webp',
            'image_base64' => 'required|string|max:18000000',
        ]);

        $apiKey = (string) config('services.gemini.api_key', '');
        if ($apiKey === '') {
            return ApiResponseHelper::apiError(
                'IA no configurada en el servidor. Define GEMINI_API_KEY (u otra variable soportada en config/services.php).',
                null,
                503,
                'GEMINI_NOT_CONFIGURED'
            );
        }

        $mime = $validated['mime'] === 'image/jpg' ? 'image/jpeg' : $validated['mime'];
        $base64 = preg_replace('/\s+/', '', $validated['image_base64']) ?? '';

        $model = (string) config('services.gemini.model', 'gemini-3.1-flash-image-preview');
        $baseUrl = rtrim((string) config('services.gemini.base_url', 'https://generativelanguage.googleapis.com'), '/');
        $url = $baseUrl.'/v1beta/models/'.rawurlencode($model).':generateContent';

        $promptText = VehicleGeminiRecortePrompt::build();
        $body = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $promptText],
                        [
                            'inline_data' => [
                                'mime_type' => $mime,
                                'data' => $base64,
                            ],
                        ],
                    ],
                ],
            ],
            'generationConfig' => [
                'responseModalities' => ['TEXT', 'IMAGE'],
                'imageConfig' => [
                    'aspectRatio' => '4:3',
                    'imageSize' => '2K',
                ],
            ],
        ];

        set_time_limit(200);

        try {
            $response = Http::withHeaders([
                'x-goog-api-key' => $apiKey,
                'Content-Type' => 'application/json',
            ])
                ->timeout(180)
                ->connectTimeout(30)
                ->post($url, $body);
        } catch (\Throwable $e) {
            Log::warning('geminiGenerateRecorte transport', ['message' => $e->getMessage()]);

            return ApiResponseHelper::apiError('No se pudo contactar a Gemini.', $e->getMessage(), 502, 'GEMINI_TRANSPORT');
        }

        $text = $response->body();
        $parsed = json_decode($text, true);
        if (! is_array($parsed)) {
            return ApiResponseHelper::apiError('Respuesta Gemini inválida.', substr($text, 0, 400), 502, 'GEMINI_INVALID_JSON');
        }

        if (! $response->ok()) {
            $msg = is_array($parsed) ? (string) data_get($parsed, 'error.message', '') : '';

            $httpStatus = $response->status();
            if ($httpStatus < 400 || $httpStatus > 599) {
                $httpStatus = 502;
            }

            return ApiResponseHelper::apiError(
                $msg !== '' ? $msg : 'Error al generar imagen.',
                substr($text, 0, 500),
                $httpStatus,
                'GEMINI_HTTP_ERROR'
            );
        }

        try {
            $block = data_get($parsed, 'promptFeedback.blockReason');
            if ($block) {
                return ApiResponseHelper::apiError('Contenido bloqueado por Gemini.', (string) $block, 422, 'GEMINI_BLOCKED');
            }

            $out = $this->extractGeminiInlineImage($parsed);

            return ApiResponseHelper::apiSuccess(200, 'Imagen generada', $out);
        } catch (\Throwable $e) {
            Log::warning('geminiGenerateRecorte parse', ['message' => $e->getMessage()]);

            return ApiResponseHelper::apiError($e->getMessage(), null, 502, 'GEMINI_PARSE');
        }
    }

    /**
     * @param  array<string, mixed>  $parsed
     * @return array{mime: string, base64: string}
     */
    private function extractGeminiInlineImage(array $parsed): array
    {
        $parts = data_get($parsed, 'candidates.0.content.parts');
        if (! is_array($parts)) {
            throw new \RuntimeException('La API no devolvió imagen.');
        }
        foreach ($parts as $p) {
            if (! is_array($p)) {
                continue;
            }
            $data = data_get($p, 'inlineData.data') ?? data_get($p, 'inline_data.data');
            if (! is_string($data) || $data === '') {
                continue;
            }
            $mime = (string) (data_get($p, 'inlineData.mimeType') ?? data_get($p, 'inline_data.mime_type') ?? 'image/png');

            return ['mime' => $mime, 'base64' => $data];
        }

        throw new \RuntimeException('La respuesta no incluye datos de imagen.');
    }
}
