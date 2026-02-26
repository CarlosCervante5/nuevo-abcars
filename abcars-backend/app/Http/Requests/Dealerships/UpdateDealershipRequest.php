<?php

namespace App\Http\Requests\Dealerships;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDealershipRequest extends FormRequest
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
        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:500',
            'address' => 'nullable|string|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ];
    }
}
