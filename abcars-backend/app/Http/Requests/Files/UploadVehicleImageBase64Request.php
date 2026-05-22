<?php

namespace App\Http\Requests\Files;

use Illuminate\Foundation\Http\FormRequest;

class UploadVehicleImageBase64Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vehicle_uuid' => 'required|uuid',
            'filename' => 'required|string|max:255',
            /** ~10 MB en base64 */
            'image_base64' => 'required|string|max:14000000',
        ];
    }
}
