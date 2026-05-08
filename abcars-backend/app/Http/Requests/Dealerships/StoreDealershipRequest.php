<?php

namespace App\Http\Requests\Dealerships;

use Illuminate\Foundation\Http\FormRequest;

class StoreDealershipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];
        foreach (['latitude', 'longitude', 'description', 'address'] as $field) {
            $val = $this->input($field);
            if ($val === '' || $val === null || $val === 'null') {
                $merge[$field] = null;
            }
        }
        // Corrección común: longitud positiva 86-118 → negativa (México)
        $lng = $this->input('longitude');
        if (is_numeric($lng)) {
            $num = (float) $lng;
            if ($num > 0 && $num >= 86 && $num <= 118) {
                $merge['longitude'] = -$num;
            }
        }
        if ($this->input('service_type') === '' || $this->input('service_type') === null) {
            $merge['service_type'] = \App\Models\Dealership::SERVICE_TYPE_VENTA;
        }
        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'service_type' => 'required|string|in:venta,servicios',
            'description' => 'nullable|string|max:500',
            'address' => 'nullable|string|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ];
    }

    public function messages(): array
    {
        return [
            'latitude.between' => 'La latitud debe estar entre -90 y 90.',
            'longitude.between' => 'La longitud debe estar entre -180 y 180 (ej: -99.13 para México).',
        ];
    }
}
