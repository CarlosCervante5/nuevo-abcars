<?php

namespace App\Http\Requests\Valuations;

use Illuminate\Foundation\Http\FormRequest;

class SearchValuationImagesRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'valuation_uuid' => [
                'required',
                'string',
                'uuid',
            ],
            'group_name' => 'required|string',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('group_name')) {
            $this->merge([
                'group_name' => strtolower((string) $this->input('group_name')),
            ]);
        }
    }

}