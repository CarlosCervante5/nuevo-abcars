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
                'string',
                'uuid',
            ],
            'begin_date' => 'sometimes|max:255|string',
            'end_date' => 'sometimes|max:255|string',
        ];
    }
}