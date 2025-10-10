<?php

namespace App\Http\Requests\Banner;

use Illuminate\Foundation\Http\FormRequest;

class MainBannerRequest extends FormRequest
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
            
            'begin_date' => 'required|max:255|string',
            'end_date' => 'required|max:255|string',
            'name' => 'required|max:255|string',
            'page_status' => 'required|max:255|string',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,pdf|max:5128'
            
        ];
    }
}
