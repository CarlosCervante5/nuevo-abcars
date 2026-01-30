<?php

namespace App\Http\Requests\Leads;

use Illuminate\Foundation\Http\FormRequest;

class StoreOfferRequest extends FormRequest
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
            'name' => 'required|max:255|string',
            'last_name' => 'nullable|max:255|string',
            'phone' => 'required|string',
            'email' => 'required|email|max:255',
            'offer_amount' => 'required|numeric',
            'payment_conditions' => 'nullable|string',
            'comments' => 'nullable|string',
            'vehicle_brand' => 'nullable|string',
            'vehicle_model' => 'nullable|string',
            'vehicle_year' => 'nullable|integer',
            'vehicle_uuid' => 'nullable|string|uuid',
            'city' => 'nullable|string'
        ];
    }
}

