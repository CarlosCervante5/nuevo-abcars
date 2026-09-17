<?php

namespace App\Services;

use App\Models\User;
use App\Models\Valuations\VehicleValuation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ValuationReportService
{
    /**
     * @return list<string>
     */
    public function headings(): array
    {
        return [
            'Fecha de valuación',
            'VIN',
            'Estatus',
            'Marca',
            'Modelo',
            'Versión',
            'Color',
            'Año',
            'Kilometraje',
            'Nombre del valuador',
            'Nombre del cliente',
            'Nombre del mecánico valuador',
            'Referencia Libro (Toma)',
            'Referencia Libro (Venta)',
            'Referencia Intelimotor (Baja)',
            'Referencia Intelimotor (Alta)',
            'Partes refacciones originales',
            'Partes refacciones genéricas',
            'Partes refacciones usadas',
            'Reacondicionamiento mano de obra',
            'Reacondicionamiento HyP',
            'Reacondicionamiento total',
            'Valor de toma',
            'Oferta final',
            'Comentarios',
            'UUID',
        ];
    }

    /**
     * @param  array{valuator_uuid?: string|null, begin_date?: string|null, end_date?: string|null, keyword?: string|null}  $filters
     */
    public function query(array $filters = []): Builder
    {
        $query = VehicleValuation::query()
            ->with([
                'vehicle.brand',
                'vehicle.model',
                'vehicle.version',
                'appointment.customer',
                'appointment.vehicle',
                'valuator.userProfile',
                'technician.userProfile',
                'spareParts.suppliers',
                'repairs',
            ])
            ->orderByDesc('created_at');

        if (! empty($filters['valuator_uuid'])) {
            $valuator = User::findByUuid((string) $filters['valuator_uuid']);
            if ($valuator) {
                $query->whereHas('valuator', function ($q) use ($valuator) {
                    $q->where('users.id', $valuator->id);
                });
            }
        }

        $begin = $filters['begin_date'] ?? null;
        $end = $filters['end_date'] ?? null;
        if ($begin && $end) {
            $query->whereBetween('created_at', [$begin.' 00:00:00', $end.' 23:59:59']);
        } elseif ($begin) {
            $query->where('created_at', '>=', $begin.' 00:00:00');
        } elseif ($end) {
            $query->where('created_at', '<=', $end.' 23:59:59');
        }

        $keyword = trim((string) ($filters['keyword'] ?? ''));
        if ($keyword !== '') {
            $like = '%'.$keyword.'%';
            $query->where(function ($q) use ($like) {
                $q->whereHas('vehicle', function ($vq) use ($like) {
                    $vq->where('vin', 'LIKE', $like);
                })
                    ->orWhereHas('appointment.vehicle', function ($vq) use ($like) {
                        $vq->where('vin', 'LIKE', $like)
                            ->orWhere('brand_name', 'LIKE', $like)
                            ->orWhere('model_name', 'LIKE', $like);
                    })
                    ->orWhereHas('appointment.customer', function ($cq) use ($like) {
                        $cq->where('name', 'LIKE', $like)
                            ->orWhere('last_name', 'LIKE', $like)
                            ->orWhere('phone_1', 'LIKE', $like);
                    });
            });
        }

        return $query;
    }

    /**
     * @param  array{valuator_uuid?: string|null, begin_date?: string|null, end_date?: string|null, keyword?: string|null}  $filters
     * @return Collection<int, array<string, mixed>>
     */
    public function rows(array $filters = []): Collection
    {
        return $this->query($filters)->get()->map(fn (VehicleValuation $valuation) => $this->mapRow($valuation));
    }

    /**
     * @return array<string, mixed>
     */
    public function mapRow(VehicleValuation $valuation): array
    {
        $vehicle = $valuation->vehicle;
        $appointmentVehicle = $valuation->appointment?->vehicle;
        $customer = $valuation->appointment?->customer;

        $valuator = $valuation->valuator->first();
        $technician = $valuation->technician->first();

        $parts = $this->sumPartsByQuoteType($valuation);
        $labor = (float) ($valuation->labor_cost ?? 0);
        $hyp = (float) ($valuation->body_work_painting_cost ?? 0);
        if ($hyp <= 0 && $valuation->relationLoaded('repairs')) {
            $hyp = (float) $valuation->repairs->sum('cost');
        }
        $originalParts = $parts['original'] > 0
            ? $parts['original']
            : (float) ($valuation->spare_parts_cost ?? 0);
        $recondTotal = $labor + $hyp + $originalParts + $parts['generic'] + $parts['used'];
        if ((float) ($valuation->estimated_total ?? 0) > 0) {
            $recondTotal = (float) $valuation->estimated_total;
        }

        $vin = $vehicle?->vin ?: ($appointmentVehicle?->vin ?: 'N/A');
        $brand = $vehicle?->brand?->name ?: ($appointmentVehicle?->brand_name ?: 'N/A');
        $model = $vehicle?->model?->name ?: ($appointmentVehicle?->model_name ?: 'N/A');
        $version = $vehicle?->version?->name ?: ($appointmentVehicle?->version_name ?: 'N/A');
        $year = $vehicle?->model?->year ?: ($appointmentVehicle?->year ?: 'N/A');
        $color = $vehicle?->exterior_color ?: ($appointmentVehicle?->exterior_color ?: 'N/A');
        $mileage = $vehicle?->mileage ?? $appointmentVehicle?->mileage ?? 'N/A';

        $valuatorName = trim(($valuator?->userProfile?->name ?? '').' '.($valuator?->userProfile?->last_name ?? ''));
        $technicianName = trim(($technician?->userProfile?->name ?? '').' '.($technician?->userProfile?->last_name ?? ''));
        $customerName = trim(($customer?->name ?? '').' '.($customer?->last_name ?? ''));

        return [
            'fecha_valuacion' => $valuation->created_at ?? 'N/A',
            'vin' => $vin,
            'estatus' => $valuation->status ?? 'N/A',
            'marca' => $brand,
            'modelo' => $model,
            'version' => $version,
            'color' => $color,
            'anio' => $year,
            'kilometraje' => $mileage,
            'nombre_valuador' => $valuatorName !== '' ? $valuatorName : 'N/A',
            'nombre_cliente' => $customerName !== '' ? $customerName : 'N/A',
            'nombre_mecanico' => $technicianName !== '' ? $technicianName : 'N/A',
            'ref_libro_toma' => $valuation->book_trade_in_offer ?? 0,
            'ref_libro_venta' => $valuation->book_sale_price ?? 0,
            'ref_intelimotor_baja' => $valuation->intellimotors_trade_in_offer ?? 0,
            'ref_intelimotor_alta' => $valuation->intellimotors_sale_price ?? 0,
            'partes_originales' => $originalParts,
            'partes_genericas' => $parts['generic'],
            'partes_usadas' => $parts['used'],
            'reacond_mano_obra' => $labor,
            'reacond_hyp' => $hyp,
            'reacond_total' => $recondTotal,
            'valor_toma' => $valuation->trade_in_final ?? 0,
            'oferta_final' => $valuation->final_offer ?? 0,
            'comentarios' => $valuation->comments ?? '',
            'uuid' => $valuation->uuid,
        ];
    }

    /**
     * Fila plana en el mismo orden que headings() (para Excel).
     *
     * @return list<mixed>
     */
    public function excelValues(array $row): array
    {
        return [
            $row['fecha_valuacion'],
            $row['vin'],
            $row['estatus'],
            $row['marca'],
            $row['modelo'],
            $row['version'],
            $row['color'],
            $row['anio'],
            $row['kilometraje'],
            $row['nombre_valuador'],
            $row['nombre_cliente'],
            $row['nombre_mecanico'],
            $row['ref_libro_toma'],
            $row['ref_libro_venta'],
            $row['ref_intelimotor_baja'],
            $row['ref_intelimotor_alta'],
            $row['partes_originales'],
            $row['partes_genericas'],
            $row['partes_usadas'],
            $row['reacond_mano_obra'],
            $row['reacond_hyp'],
            $row['reacond_total'],
            $row['valor_toma'],
            $row['oferta_final'],
            $row['comentarios'],
            $row['uuid'],
        ];
    }

    /**
     * @return array{original: float, generic: float, used: float}
     */
    private function sumPartsByQuoteType(VehicleValuation $valuation): array
    {
        $totals = ['original' => 0.0, 'generic' => 0.0, 'used' => 0.0];
        if (! $valuation->relationLoaded('spareParts')) {
            return $totals;
        }

        foreach ($valuation->spareParts as $part) {
            $qty = max(1, (float) ($part->quantity ?? 1));
            foreach ($part->suppliers ?? [] as $supplier) {
                $type = strtolower((string) ($supplier->pivot->quote_type ?? ''));
                if (! isset($totals[$type])) {
                    continue;
                }
                $totals[$type] += ((float) ($supplier->pivot->cost ?? 0)) * $qty;
            }
        }

        return $totals;
    }
}
