<?php

namespace App\Http\Controllers\Vehicles;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Files\UploadVehicleImageBase64Request;
use App\Http\Requests\Files\UploadVehicleImageRequest;
use App\Http\Requests\Vehicles\VehicleImages\DeleteVehicleImageBatchRequest;
use App\Http\Requests\Vehicles\VehicleImages\DeleteVehicleImageRequest;
use App\Http\Requests\Vehicles\VehicleImages\UpdateSortVehicleImageRequest;
use App\Jobs\UploadVehicleImage;
use App\Models\Vehicle;
use App\Models\VehicleImage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class VehicleImageController extends Controller
{
    /**
     * Crear nuevo set de imágenes de vehículo.
     *
     * @param  \App\Http\Requests\Users\UploadVehicleImageRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(UploadVehicleImageRequest $request)
    {
        try {
            
            $vehicle_uuid = $request->input('vehicle_uuid');
            $images = $request->file('images');

            if ($images === null) {
                $fallback = $request->file('images.0');
                $images = $fallback !== null ? [$fallback] : [];
            } elseif (! is_array($images)) {
                $images = [$images];
            }

            $vehicle = Vehicle::findByUuid($vehicle_uuid);

            if (!$vehicle) {

                return ApiResponseHelper::apiError('El vehiculo no existe', 'No existe el id: '. $vehicle_uuid ,404, 'CREATE_VEHICLE_IMAGES_ERROR');
            }

            if (count($images) === 0) {
                return ApiResponseHelper::apiError(
                    'No se recibió ningún archivo de imagen. Verifica la conexión de la app.',
                    null,
                    422,
                    'CREATE_VEHICLE_IMAGES_EMPTY'
                );
            }

            // Obtener el sort_id más alto de las imágenes del vehículo, sino regresa 1
            $sort_id = $vehicle->images->max('sort_id') + 1 ?? 1;

            $invalidImages = [];

            foreach ($images as $index => $image) {

                // Validar si el archivo es válido
                if (!$image->isValid()) {
                    // Registrar la imagen inválida
                    $invalidImages[] = $image->getClientOriginalName();
                    continue; // Saltar a la siguiente iteración del bucle
                }

                // Guardar temporalmente el archivo
                $path = $image->store('temp_images');


                // Determinar si es la última imagen
                $is_last = $index === count($images) - 1;

                // Ejecutar en el mismo proceso para asegurar acceso al archivo temporal en Railway
                UploadVehicleImage::dispatchSync($path, $vehicle->uuid, $vehicle->id, ($sort_id + $index), $image->getClientOriginalName(), $is_last);
            }

            if (!empty($invalidImages)) {
                return ApiResponseHelper::apiSuccess(201, 'El set de imagenes se envió a procesar, pero contenía ALGUNOS archivos inválidos o corruptos', $invalidImages);
            }
        
            // Retornar respuesta exitosa
            return ApiResponseHelper::apiSuccess(201, 'Set de imagenes enviadas a procesar');

        } catch (ValidationException $e) {
            // Manejar errores de validación y retornar respuesta de error
            return ApiResponseHelper::validationError($e);

        } catch (\Exception $e) {
            // Manejar otros errores y retornar respuesta de error
            return ApiResponseHelper::apiError('Error al crear el set de imagenes', $e->getMessage(), 500, 'CREATE_VEHICLE_IMAGES_ERROR');
        }
    }

    /**
     * Subida de una imagen en base64 (app móvil: evita multipart nativo que falla con HTTP 0).
     */
    public function storeBase64(UploadVehicleImageBase64Request $request)
    {
        try {
            $vehicle_uuid = $request->input('vehicle_uuid');
            $filename = $request->input('filename');
            $raw = (string) $request->input('image_base64');

            if (str_contains($raw, ',')) {
                $raw = explode(',', $raw, 2)[1];
            }

            $bytes = base64_decode($raw, true);
            if ($bytes === false || strlen($bytes) < 128) {
                return ApiResponseHelper::apiError(
                    'Imagen base64 inválida o vacía',
                    null,
                    422,
                    'CREATE_VEHICLE_IMAGES_INVALID_BASE64'
                );
            }

            if (strlen($bytes) > 10 * 1024 * 1024) {
                return ApiResponseHelper::apiError(
                    'La imagen supera el tamaño máximo (10 MB)',
                    null,
                    422,
                    'CREATE_VEHICLE_IMAGES_TOO_LARGE'
                );
            }

            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = $finfo ? finfo_buffer($finfo, $bytes) : null;
            if ($finfo) {
                finfo_close($finfo);
            }

            $allowed = ['image/jpeg', 'image/png', 'image/webp'];
            if ($mime === false || $mime === null || ! in_array($mime, $allowed, true)) {
                return ApiResponseHelper::apiError(
                    'Tipo de imagen no permitido: '.($mime ?: 'desconocido'),
                    null,
                    422,
                    'CREATE_VEHICLE_IMAGES_INVALID_MIME'
                );
            }

            $vehicle = Vehicle::findByUuid($vehicle_uuid);
            if (! $vehicle) {
                return ApiResponseHelper::apiError(
                    'El vehiculo no existe',
                    'No existe el id: '.$vehicle_uuid,
                    404,
                    'CREATE_VEHICLE_IMAGES_ERROR'
                );
            }

            $ext = match ($mime) {
                'image/png' => 'png',
                'image/webp' => 'webp',
                default => 'jpg',
            };

            $storagePath = 'temp_images/mobile_'.uniqid('', true).'.'.$ext;
            Storage::put($storagePath, $bytes);

            $sort_id = ($vehicle->images->max('sort_id') ?? 0) + 1;

            UploadVehicleImage::dispatchSync(
                $storagePath,
                $vehicle->uuid,
                $vehicle->id,
                $sort_id,
                $filename,
                true
            );

            return ApiResponseHelper::apiSuccess(201, 'Imagen enviada a procesar');
        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError(
                'Error al crear la imagen',
                $e->getMessage(),
                500,
                'CREATE_VEHICLE_IMAGES_ERROR'
            );
        }
    }

    /**
     * Actualizar orden de las imágenes
     *
     * @param  \App\Http\Requests\Vehicles\VehicleImages\UpdateSortVehicleImageRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sortUpdate( UpdateSortVehicleImageRequest $request)
    {
        try {

            $data = $request->validated();

            DB::transaction(function () use ($data) {
                foreach ($data['image_order'] as $order) {
                    VehicleImage::where('uuid', $order['uuid'])->update(['sort_id' => $order['sort_id']]);
                }
            });

            return ApiResponseHelper::apiSuccess(200, 'Imagenes reordenadas exitosamente');

        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener la imagen vehículo', $e->getMessage(), 500, 'GET_VEHICLE_IMAGE_ERROR');
        }
    }

    /**
     * Borrar imagen del vehículo
     *
     * @param  \App\Http\Requests\Vehicles\VehicleImages\DeleteVehicleImageRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function delete( DeleteVehicleImageRequest $request)
    {
        try {

            $data = $request->validated();

            $vehicle_image = VehicleImage::findByUuid($data['uuid']);
        
            if ($vehicle_image) {
                
                $vehicle = $vehicle_image->vehicle()->first();

                $vehicle_image->delete();

                $vehicle_images = $vehicle->images()->count();

                if ($vehicle_images === 0) {
                    $vehicle->update(['page_status' => 'inactive']);
                }

                return ApiResponseHelper::apiSuccess(200, 'Imagen de vehículo eliminada exitosamente');
                
            } else {
                return ApiResponseHelper::apiError('La imagen del vehículo', 'No existe el id: '. $data['uuid'] ,404, 'GET_VEHICLE_IMAGE_ERROR');
            }


        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener la imagen vehículo', $e->getMessage(), 500, 'GET_VEHICLE_IMAGE_ERROR');
        }
    }

    /**
     * Borrar imagenes del vehículo
     *
     * @param  \App\Http\Requests\Vehicles\VehicleImages\DeleteVehicleImageBatchRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteBatch( DeleteVehicleImageBatchRequest $request)
    {
        try {

            $data = $request->validated();

            $vehicle = Vehicle::findByUuid($data['vehicle_uuid']);

            if (!$vehicle) {

                return ApiResponseHelper::apiError('El vehiculo no existe', 'No existe el uuid: '. $data['vehicle_uuid'] ,404, 'CREATE_VEHICLE_IMAGES_ERROR');
            }
        
            $vehicle->images()->delete();

            $vehicle->update(['page_status' => 'inactive']);

            return ApiResponseHelper::apiSuccess(200, 'Imagenes de vehículo eliminadas exitosamente');

        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al eliminar las imagenes del vehiculo', $e->getMessage(), 500, 'DELETE_VEHICLE_IMAGES_ERROR');
        }
    }

}
