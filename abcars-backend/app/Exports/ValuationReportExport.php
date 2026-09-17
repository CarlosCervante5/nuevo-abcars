<?php

namespace App\Exports;

use App\Services\ValuationReportService;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ValuationReportExport implements FromCollection, WithHeadings, ShouldAutoSize
{
    protected ?string $begin_date;

    protected ?string $end_date;

    protected ?string $valuator_uuid;

    protected ?string $keyword;

    public function __construct(
        $valuator_uuid = null,
        $begin_date = null,
        $end_date = null,
        $keyword = null,
    ) {
        $this->valuator_uuid = $valuator_uuid;
        $this->begin_date = $begin_date;
        $this->end_date = $end_date;
        $this->keyword = $keyword;
    }

    public function collection(): Collection
    {
        $service = app(ValuationReportService::class);

        return $service->rows([
            'valuator_uuid' => $this->valuator_uuid,
            'begin_date' => $this->begin_date,
            'end_date' => $this->end_date,
            'keyword' => $this->keyword,
        ])->map(fn (array $row) => $service->excelValues($row));
    }

    public function headings(): array
    {
        return app(ValuationReportService::class)->headings();
    }
}
