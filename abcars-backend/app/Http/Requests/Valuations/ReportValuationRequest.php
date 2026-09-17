<?php

namespace App\Http\Requests\Valuations;

use Illuminate\Foundation\Http\FormRequest;

class ReportValuationRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'valuator_uuid' => [
                'sometimes',
                'nullable',
                'string',
                'uuid',
            ],
            'begin_date' => 'sometimes|nullable|max:255|string',
            'end_date' => 'sometimes|nullable|max:255|string',
            'keyword' => 'sometimes|nullable|string|max:255',
            'format' => 'sometimes|nullable|string|in:json,xlsx,excel',
        ];
    }
}