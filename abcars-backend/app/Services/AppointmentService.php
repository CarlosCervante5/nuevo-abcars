<?php

namespace App\Services;

use App\Mail\ValuationNotification;
use App\Models\Customer;
use App\Models\CustomerAppointment;
use App\Models\CustomerVehicle;
use App\Models\LineModel;
use App\Models\VehicleBrand;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AppointmentService
{   
    /**
     * Crea una cita.
     *
     * @param array $data Datos de la cita a crear.
     */
    public function createAppointment($data)
    {
        $customer = Customer::findByUuid($data['customer_uuid']);

        // Persistir marca/modelo en catálogo para reutilizarlos en el autocomplete.
        $this->syncVehicleCatalog($data);

        $customer_vehicle = CustomerVehicle::firstOrCreate([
            'mileage' => $data['mileage'],
            'brand_name' => $data['brand_name'],
            'model_name' => $data['model_name'],
            'year' => $data['year'],
            'customer_id' => $customer->id
        ]);

        $customer_appointment = CustomerAppointment::create([
            'type' => $data['type'],
            'scheduled_date' => $data['scheduled_date'],
            'dealership_name' => $data['dealership_name'],
            'vehicle_id' => $customer_vehicle->id,
            'customer_id' => $customer->id
        ]);

        $pueblaMail = trim((string) env('VALUATION_PUEBLA_MAIL', ''));
        $hidalgoMail = trim((string) env('VALUATION_HIDALGO_MAIL', ''));

        if ($data['dealership_name'] != 'vecsa hidalgo' && $pueblaMail !== '') {
            $to = $pueblaMail;
            $customerId = $customer->id;
            $vehicleId = $customer_vehicle->id;
            $appointmentId = $customer_appointment->id;

            dispatch(function () use ($to, $customerId, $vehicleId, $appointmentId) {
                $c = Customer::find($customerId);
                $v = CustomerVehicle::find($vehicleId);
                $a = CustomerAppointment::find($appointmentId);

                if ($c && $v && $a) {
                    try {
                        Mail::to($to)->send(new ValuationNotification($c, $v, $a));
                        Log::info('Valuation notification sent', [
                            'to' => $to,
                            'appointment_id' => $appointmentId,
                            'dealership_name' => $a->dealership_name,
                        ]);
                    } catch (\Throwable $e) {
                        Log::error('Valuation notification failed', [
                            'to' => $to,
                            'appointment_id' => $appointmentId,
                            'dealership_name' => $a->dealership_name,
                            'error' => $e->getMessage(),
                        ]);
                    }
                } else {
                    Log::warning('Valuation notification skipped: missing entities', [
                        'to' => $to,
                        'customer_found' => (bool) $c,
                        'vehicle_found' => (bool) $v,
                        'appointment_found' => (bool) $a,
                        'appointment_id' => $appointmentId,
                    ]);
                }
            })->afterResponse();
        } elseif ($data['dealership_name'] === 'vecsa hidalgo' && $hidalgoMail !== '') {
            $to = $hidalgoMail;
            $customerId = $customer->id;
            $vehicleId = $customer_vehicle->id;
            $appointmentId = $customer_appointment->id;

            dispatch(function () use ($to, $customerId, $vehicleId, $appointmentId) {
                $c = Customer::find($customerId);
                $v = CustomerVehicle::find($vehicleId);
                $a = CustomerAppointment::find($appointmentId);

                if ($c && $v && $a) {
                    try {
                        Mail::to($to)->send(new ValuationNotification($c, $v, $a));
                        Log::info('Valuation notification sent', [
                            'to' => $to,
                            'appointment_id' => $appointmentId,
                            'dealership_name' => $a->dealership_name,
                        ]);
                    } catch (\Throwable $e) {
                        Log::error('Valuation notification failed', [
                            'to' => $to,
                            'appointment_id' => $appointmentId,
                            'dealership_name' => $a->dealership_name,
                            'error' => $e->getMessage(),
                        ]);
                    }
                } else {
                    Log::warning('Valuation notification skipped: missing entities', [
                        'to' => $to,
                        'customer_found' => (bool) $c,
                        'vehicle_found' => (bool) $v,
                        'appointment_found' => (bool) $a,
                        'appointment_id' => $appointmentId,
                    ]);
                }
            })->afterResponse();
        }

        return $customer_appointment;
    }

    private function syncVehicleCatalog(array $data): void
    {
        try {
            $brandName = trim((string) ($data['brand_name'] ?? ''));
            $modelName = trim((string) ($data['model_name'] ?? ''));

            if ($brandName === '' || $modelName === '') {
                return;
            }

            $brand = VehicleBrand::query()
                ->whereRaw('LOWER(name) = ?', [mb_strtolower($brandName, 'UTF-8')])
                ->first();

            if (! $brand) {
                $brand = VehicleBrand::create([
                    'name' => $brandName,
                ]);
            }

            $model = LineModel::query()
                ->where('brand_id', $brand->id)
                ->whereRaw('LOWER(name) = ?', [mb_strtolower($modelName, 'UTF-8')])
                ->first();

            if (! $model) {
                $rawYear = (int) ($data['year'] ?? 0);
                $safeYear = $rawYear > 0 ? $rawYear : (int) date('Y');

                LineModel::create([
                    'name' => $modelName,
                    'year' => $safeYear,
                    'brand_id' => $brand->id,
                    'line_id' => null,
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Vehicle catalog sync failed during appointment creation', [
                'brand_name' => $data['brand_name'] ?? null,
                'model_name' => $data['model_name'] ?? null,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
