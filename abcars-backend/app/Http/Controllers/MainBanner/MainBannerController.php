<?php

namespace App\Http\Controllers\MainBanner;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Banner\MainBannerRequest;
use App\Http\Requests\Banner\SearchMainBannerRequest;
use App\Jobs\UploadBannerMainImage;
use App\Models\MarketingCampaign;
use Illuminate\Http\Request;

class MainBannerController extends Controller
{
    /**
     * Almacenar imagen del banner principal.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(MainBannerRequest $request)
    {
        try {

            $data = $request->validated();

            $existingBanner = MarketingCampaign::where('name', 'Imagen banner principal')->exists();

            if (!$existingBanner) {
                $banner = MarketingCampaign::create([
                    'begin_date' => $data['begin_date'],
                    'end_date' => $data['end_date'],
                    'name' => $data['name'],
                    'page_status' => $data['page_status']
                ]);
            } else {
                $query = MarketingCampaign::query();

                $queryResult = $query->where('name', 'Imagen banner principal')->first();

                $image = $request->file('image');
                // dd($image);
                $path = $image->store('temp_image');

                UploadBannerMainImage::dispatchSync($path, $queryResult, $image->getClientOriginalName());

                return ApiResponseHelper::apiSuccess(200, 'Imagen de banner principal creada exitosamente');
            }

            $image = $request->file('image');

            $path = $image->store('temp_image');

            // dd($path);

            UploadBannerMainImage::dispatchSync($path, $banner, $image->getClientOriginalName());

            return ApiResponseHelper::apiSuccess(200, 'Imagen de banner principal creada exitosamente');

        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al actualizar la imagen', $e->getMessage(), 500, 'CREATE_IMAGE_ERROR');
        }
    }

    /**
     * Obtener solamente el registro que contiene el main banner
     * 
     */
    public function search(SearchMainBannerRequest $request)
    {
        try {
            
            $data = $request->validated();

            
            $main_image = MarketingCampaign::where('name', $data['name'])->first();

            return ApiResponseHelper::apiSuccess(200, 'Imagen del banner principal obtenida exitosamente', ['image_path' => $main_image->image_path]);

        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener la imagen del banner principal', $e->getMessage(), 500, 'GET_MAIN_BANNER_ERROR');
        }
    }
}
