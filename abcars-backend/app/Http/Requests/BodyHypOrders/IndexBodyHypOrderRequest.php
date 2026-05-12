<?php

namespace App\Http\Requests\BodyHypOrders;

use Illuminate\Foundation\Http\FormRequest;

class IndexBodyHypOrderRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'page' => $this->query('page', 1),
            'per_page' => $this->query('per_page', 15),
        ]);
    }

    public function authorize(): bool
    {
        return $this->user() !== null
            && $this->user()->can('view body hyp standalone orders');
    }

    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ];
    }
}
