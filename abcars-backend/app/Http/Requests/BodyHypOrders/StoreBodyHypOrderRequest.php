<?php

namespace App\Http\Requests\BodyHypOrders;

use Illuminate\Foundation\Http\FormRequest;

class StoreBodyHypOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null
            && $this->user()->can('create body hyp standalone orders');
    }

    public function rules(): array
    {
        return [
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['required', 'string', 'min:5', 'max:8000'],
        ];
    }
}
