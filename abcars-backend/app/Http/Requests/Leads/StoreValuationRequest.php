<?php

namespace App\Http\Requests\Leads;

use Illuminate\Foundation\Http\FormRequest;

class StoreValuationRequest extends FormRequest
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
            'fullName' => 'required|max:255|string',
            'lastName' => 'nullable|max:255|string',
            'phone' => 'required|string',
            'email' => 'required|email|max:255',
            'city' => 'nullable|string',
            'preferredDate' => 'nullable|string',
            'preferredTime' => 'nullable|string',
            'brand' => 'required|string',
            'model' => 'required|string',
            'year' => 'required|integer',
            'mileage' => 'required|integer',
        ];
    }
}

