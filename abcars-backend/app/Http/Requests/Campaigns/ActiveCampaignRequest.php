<?php

namespace App\Http\Requests\Campaigns;

use Illuminate\Foundation\Http\FormRequest;

class ActiveCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'placement' => 'nullable|in:showroom,inventory',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'placement' => $this->placement ?? 'showroom',
        ]);
    }
}
