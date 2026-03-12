<?php

namespace App\Http\Controllers\DeliveryPhotos;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Jobs\UploadDeliveryPhoto;
use App\Models\DeliveryPhoto;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DeliveryPhotoController extends Controller
{
    /**
     * Listar fotos de entregas (público, para el home).
     * Paginado: 10 imágenes por página.
     */
    public function index(Request $request)
    {
        try {
            $perPage = min((int) $request->input('per_page', 10), 50);
            $page = max(1, (int) $request->input('page', 1));

            $paginator = DeliveryPhoto::orderBy('sort_order')->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            return ApiResponseHelper::apiSuccess(200, 'Fotos de entregas obtenidas', [
                'data' => $paginator->items(),
                'total' => $paginator->total(),
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'last_page' => $paginator->lastPage(),
            ]);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener fotos', $e->getMessage(), 500, 'GET_DELIVERY_PHOTOS_ERROR');
        }
    }

    /**
     * Subir foto de entrega (requiere auth + rol administrator o gestor).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,jpeg,gif,webp|max:10128',
            'caption' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        try {
            $image = $request->file('image');
            $path = $image->store('temp_images');
            $caption = $validated['caption'] ?? null;
            $sortOrder = isset($validated['sort_order']) ? (int) $validated['sort_order'] : (DeliveryPhoto::max('sort_order') ?? 0) + 1;

            UploadDeliveryPhoto::dispatchSync($path, $caption, $sortOrder, $image->getClientOriginalName());

            return ApiResponseHelper::apiSuccess(201, 'Foto de entrega subida correctamente');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al subir la foto', $e->getMessage(), 500, 'UPLOAD_DELIVERY_PHOTO_ERROR');
        }
    }

    /**
     * Eliminar foto de entrega.
     */
    public function destroy(string $uuid)
    {
        try {
            $photo = DeliveryPhoto::where('uuid', $uuid)->first();
            if (!$photo) {
                return ApiResponseHelper::apiError('Foto no encontrada', null, 404, 'DELIVERY_PHOTO_NOT_FOUND');
            }
            $photo->delete();
            return ApiResponseHelper::apiSuccess(200, 'Foto eliminada correctamente');
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al eliminar la foto', $e->getMessage(), 500, 'DELETE_DELIVERY_PHOTO_ERROR');
        }
    }
}
