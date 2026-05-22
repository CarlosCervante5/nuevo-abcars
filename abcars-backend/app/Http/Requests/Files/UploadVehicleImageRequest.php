<?php

namespace App\Http\Requests\Files;

use Illuminate\Foundation\Http\FormRequest;

class UploadVehicleImageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'vehicle_uuid' => 'required|uuid',
            'images' => 'required|array|min:1',
            'images.*' => 'required|file|mimes:jpeg,jpg,png,webp|max:10240',
        ];
    }
}
