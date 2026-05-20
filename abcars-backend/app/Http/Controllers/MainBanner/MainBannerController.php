<?php

namespace App\Http\Controllers\MainBanner;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Banner\MainBannerRequest;
use App\Http\Requests\Banner\SearchMainBannerRequest;
use App\Jobs\UploadBannerMainImage;
use App\Models\MarketingCampaign;
use App\Support\MainBannerNames;

class MainBannerController extends Controller
{
    /**
     * Almacenar imagen del banner principal (variante desktop o móvil).
     */
    public function store(MainBannerRequest $request)
    {
        try {
            $data = $request->validated();
            $campaignName = MainBannerNames::forVariant($data['variant'] ?? 'desktop');

            $banner = MarketingCampaign::firstOrCreate(
                ['name' => $campaignName],
                [
                    'begin_date' => $data['begin_date'],
                    'end_date' => $data['end_date'],
                    'page_status' => $data['page_status'],
                ]
            );

            $image = $request->file('image');
            $path = $image->store('temp_image');

            UploadBannerMainImage::dispatchSync($path, $banner, $image->getClientOriginalName());

            return ApiResponseHelper::apiSuccess(200, 'Imagen de banner principal creada exitosamente', [
                'variant' => ($data['variant'] ?? 'desktop') === 'mobile' ? 'mobile' : 'desktop',
                'image_path' => $banner->fresh()->image_path,
            ]);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al actualizar la imagen', $e->getMessage(), 500, 'CREATE_IMAGE_ERROR');
        }
    }

    /**
     * Obtener URLs del banner principal (desktop y móvil).
     */
    public function search(SearchMainBannerRequest $request)
    {
        try {
            $request->validated();

            $desktop = MarketingCampaign::where('name', MainBannerNames::DESKTOP)->first();
            $mobile = MarketingCampaign::where('name', MainBannerNames::MOBILE)->first();

            $desktopPath = $desktop?->image_path;
            $mobilePath = $mobile?->image_path;

            return ApiResponseHelper::apiSuccess(200, 'Imagen del banner principal obtenida exitosamente', [
                'image_path' => $desktopPath ?? $mobilePath,
                'image_path_desktop' => $desktopPath,
                'image_path_mobile' => $mobilePath,
            ]);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener la imagen del banner principal', $e->getMessage(), 500, 'GET_MAIN_BANNER_ERROR');
        }
    }
}
