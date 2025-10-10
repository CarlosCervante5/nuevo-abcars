<?php

namespace App\Exports;

use App\Models\User;
use App\Models\Valuations\VehicleValuation;
use Maatwebsite\Excel\Concerns\FromCollection;

class ValuationReportExport implements FromCollection
{
    protected $begin_date;
    protected $end_date;
    protected $valuator_uuid;

    public function __construct($valuator_uuid = null , $begin_date = null, $end_date = null)
    {
        $this->valuator_uuid = $valuator_uuid;
        $this->begin_date = $begin_date;
        $this->end_date = $end_date;
    }

    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        
        // Construir la consulta base
        $query = VehicleValuation::query();

        // Filtrar por valuador si se proporciona el UUID
        if ($this->valuator_uuid) {
            
            $valuator = User::findByUuid($this->valuator_uuid);

            if ($valuator) {
                $query->whereHas('valuator', function ($q) use ($valuator) {
                    $q->where('users.id', $valuator->id);
                });
            }
        }

        // Aplicar filtros de fechas
        if ($this->begin_date && $this->end_date) {
            $query->whereBetween('created_at', [$this->begin_date, $this->end_date]);
        } elseif ($this->begin_date) {
            $query->where('created_at', '>=', $this->begin_date);
        }


        $results = $query->with(['vehicle','valuator.userProfile'])->get();

        // Formatear los resultados en un array simple
        return $results->map(function ($valuation) {
            return [
                'ID' => $valuation->id,
                'Estatus' => $valuation->status,
                'VIN' => $valuation->vehicle->vin ?? 'N/A',
                'Nombre(s)' => $valuation->valuator[0]->userProfile->name ?? 'N/A',
                'Apellido(s)' => $valuation->valuator[0]->userProfile->last_name ?? 'N/A',
            ];
        });

        return $query->get();

    }

    public function headings(): array
    {
        return ['ID', 'Estatus', 'VIN', 'Nombre(s)', 'Apellido(s)'];
    }
}
