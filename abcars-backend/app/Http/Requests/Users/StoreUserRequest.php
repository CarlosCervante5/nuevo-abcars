<?php

namespace App\Http\Requests\Users;

use App\Models\Dealership;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];
        foreach (['phone_1', 'phone_2', 'gender'] as $field) {
            $val = $this->input($field);
            if ($val === '' || $val === null || $val === 'null') {
                $merge[$field] = null;
            }
        }
        $did = $this->input('dealership_id');
        if ($did === '' || $did === null || $did === 'null') {
            $merge['dealership_id'] = null;
        } elseif (is_numeric($did)) {
            $merge['dealership_id'] = (int) $did;
        }
        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone_1' => 'nullable|string|max:20',
            'phone_2' => 'nullable|string|max:20',
            'gender' => 'nullable|in:male,female,H,M',
            'dealership_id' => [
                'required',
                'integer',
                Rule::exists((new Dealership())->getTable(), 'id'),
            ],
            /** Se rellena en servidor desde la sucursal; el cliente puede enviar texto vacío. */
            'location' => 'nullable|string|max:90',
            'role_name' => 'required|string|max:255',
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*[a-zñ])(?=.*[A-ZÑ])(?=.*\d)(?=.*[@$!%*?&])[A-Za-zÑñ\d@$!%*?&]+$/u'
            ],
            'image' => 'nullable|image|mimes:jpeg,png,jpg,jpeg,gif,webp|max:10128',
            'image.*' => 'nullable|image|mimes:jpeg,png,jpg,jpeg,gif,webp|max:10128',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'password.regex' => 'La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un dígito y un carácter especial (@$!%*?&).',
            'email.unique' => 'El correo electrónico ya está en uso. Por favor, elija otro para registrarse.'
        ];
    }
}
