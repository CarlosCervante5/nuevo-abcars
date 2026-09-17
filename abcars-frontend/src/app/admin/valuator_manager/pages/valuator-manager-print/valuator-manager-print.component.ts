import { Component, ElementRef, ViewChild, type OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Overview, UserTechnicians, GetUsersByRol } from '@interfaces/admin.interfaces';
import {
  ValuatorManagerPrintService,
  ValuationReportFilters,
  ValuationReportRow
} from '@services/valuator-manager-print.service';
import { AppointmentService } from '@services/appointment.service';
import { isValuationReadOnlyViewer } from '@helpers/valuation-view.helper';

@Component({
  selector: 'app-valuator-manager-print',
  templateUrl: './valuator-manager-print.component.html',
  styleUrl: './valuator-manager-print.component.css',
  standalone: false
})
export class ValuatorManagerPrintComponent implements OnInit {
  @ViewChild('dateValuation') dateValuation!: ElementRef<HTMLInputElement>;
  @ViewChild('dateEndValuation') dateEndValuation!: ElementRef<HTMLInputElement>;

  public inputDateValuation = '';
  public inputDateEndValuation = '';
  public keyword = '';
  public valuators: UserTechnicians[] = [];
  public iduservaluator: string | null = '';

  public loading = false;
  public exporting = false;
  public error: string | null = null;
  public rows: ValuationReportRow[] = [];
  public previewLoaded = false;

  public itemOverview: Overview;

  constructor(
    private _valuatorManagerPrintService: ValuatorManagerPrintService,
    private _appointmentService: AppointmentService,
    private _router: Router
  ) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.itemOverview = {
        user: {
          name: user.name || user.nickname || 'Usuario',
          surname: user.surname || '',
          role: 'Valuation Manager',
          email: user.email || '',
          picturepath: ''
        },
        pages: [
          {
            title: 'Imprimir valuación',
            icon: 'fi fi-rr-print',
            permalink: '/admin/valuation_manager/print'
          }
        ]
      };
    } catch {
      this.itemOverview = {
        user: {
          name: 'Usuario',
          surname: '',
          role: 'Valuation Manager',
          email: '',
          picturepath: ''
        },
        pages: [
          {
            title: 'Imprimir valuación',
            icon: 'fi fi-rr-print',
            permalink: '/admin/valuation_manager/print'
          }
        ]
      };
    }
  }

  ngOnInit(): void {
    this.getValuators();
  }

  public getValuators(): void {
    this._valuatorManagerPrintService.getValuators().subscribe({
      next: (valuators: GetUsersByRol) => {
        this.valuators = valuators.data.users;
      },
      error: () => {
        this.error = 'No se pudieron cargar los valuadores';
      }
    });
  }

  public onChange(valuatorId: string | null): void {
    this.iduservaluator = valuatorId ? valuatorId : null;
  }

  public getDateValuation(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.inputDateValuation = target.value || '';
  }

  public getDateEndValuation(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.inputDateEndValuation = target.value || '';
  }

  private currentFilters(): ValuationReportFilters {
    return {
      valuator_uuid: this.iduservaluator || null,
      begin_date: this.inputDateValuation || null,
      end_date: this.inputDateEndValuation || null,
      keyword: this.keyword.trim() || null
    };
  }

  public loadPreview(): void {
    this.loading = true;
    this.error = null;
    this._valuatorManagerPrintService.previewReport(this.currentFilters()).subscribe({
      next: (res) => {
        this.rows = res.data?.rows || [];
        this.previewLoaded = true;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'No se pudo cargar el reporte';
      }
    });
  }

  public exportExcel(): void {
    this.exporting = true;
    this.error = null;
    this._valuatorManagerPrintService.downloadReportExcel(this.currentFilters()).subscribe({
      next: (blob) => {
        this.exporting = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'valuations_report.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.exporting = false;
        this.error = err?.error?.message || 'No se pudo exportar a Excel';
      }
    });
  }

  public openValuation(row: ValuationReportRow): void {
    const role = localStorage.getItem('role') || '';
    const canOpenChecklist =
      isValuationReadOnlyViewer() ||
      ['valuator', 'seller', 'appraiser_technician'].includes(role);

    if (canOpenChecklist) {
      this._router.navigate(['/admin/valuator/checklist', row.uuid]);
      return;
    }

    this._appointmentService.openDownloadValuation(row.uuid).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => {
        this.error = 'No se pudo abrir la valuación';
      }
    });
  }

  public money(value: number | string | null | undefined): string {
    const n = Number(value || 0);
    return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }
}
