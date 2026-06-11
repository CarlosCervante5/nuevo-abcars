<?php

namespace App\Http\Requests\Vehicles;

use App\Rules\ActiveVehicleExists;
use Illuminate\Foundation\Http\FormRequest;

class MarkVehicleConsignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'uuid' => [
                'required',
                'string',
                'uuid',
                new ActiveVehicleExists,
            ],
        ];
    }
}
