<?php

namespace App\Http\Requests\Blogs;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSortPostContentRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'content_order' => 'required|array',
            'content_order.*.uuid' => 'required|uuid',
            'content_order.*.sort_id' => 'required|integer|min:1',
        ];
    }

}