<?php

namespace App\Http\Requests\Appointments;

use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
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
            'type' => 'required|max:255|string',
            'customer_uuid' => 'required|max:255|string',
            'brand_name' => 'required|max:255|string',
            'model_name' => 'required|max:255|string',
            'year' => 'required|integer',
            'mileage' => 'required|integer',
            'scheduled_date' => 'required|max:255|string',
            'dealership_name' => 'required|max:255|string',
            // Sin exists: si el UUID no coincide (espacios/mayúsculas/typos), la cita igual se crea; el referido se resuelve en AppointmentService.
            'referrer_uuid' => 'nullable|string|max:64',
        ];
    }

    protected function prepareForValidation(): void
    {
        $merge = [];
        if ($this->has('year') && is_numeric($this->input('year'))) {
            $merge['year'] = (int) $this->input('year');
        }
        if ($this->has('mileage') && is_numeric($this->input('mileage'))) {
            $merge['mileage'] = (int) $this->input('mileage');
        }
        if ($this->has('referrer_uuid')) {
            $ru = $this->input('referrer_uuid');
            if (is_string($ru)) {
                $clean = strtolower(trim(str_replace(['{', '}', ' '], '', $ru)));
                $merge['referrer_uuid'] = $clean !== '' ? $clean : null;
            }
        }
        if ($merge !== []) {
            $this->merge($merge);
        }
    }
}
