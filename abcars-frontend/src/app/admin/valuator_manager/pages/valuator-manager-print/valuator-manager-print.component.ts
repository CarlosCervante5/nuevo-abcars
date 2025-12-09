import { Component, ElementRef, ViewChild, type OnInit } from '@angular/core';

import { environment } from '@environments/environment';
import { GetUsersByRol, UserTechnicians, Overview } from '@interfaces/admin.interfaces';

import { ValuatorManagerPrintService } from '@services/valuator-manager-print.service';

@Component({
  selector: 'app-valuator-manager-print',
  // imports: [],
  templateUrl: './valuator-manager-print.component.html',
  styleUrl: './valuator-manager-print.component.css',
  standalone: false
})
export class ValuatorManagerPrintComponent implements OnInit {
  @ViewChild('dateValuation') dateValuation!: ElementRef<HTMLInputElement>;
  @ViewChild('dateEndValuation') dateEndValuation!: ElementRef<HTMLInputElement>;

  public url: string = environment.baseUrl;
  public inputDateValuation!: string;
  public inputDateEndValuation: string | null = null;
  public valuators: UserTechnicians[] = [];
  public iduservaluator: string | null = '';

  // References Overview para el encabezado
  public itemOverview: Overview;

  constructor(
    private _valuatorManagerPrintService: ValuatorManagerPrintService
  ){
    // Inicializar itemOverview
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
    } catch (error) {
      // Fallback si hay error al parsear
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

  public getValuators(){
    this._valuatorManagerPrintService.getValuators()
    .subscribe({
      next: ( valuators: GetUsersByRol ) => {
        this.valuators = valuators.data.users;
        console.log(this.valuators);
      }
    });
  }

  public onChange(valuatorId: string | null){
    console.log(valuatorId);
    this.iduservaluator = valuatorId ? valuatorId : null;
  }

  public getDateValuation(event: Event){
    const target = event.target as HTMLInputElement;
    const dateValue = target.value;
    this.inputDateValuation = dateValue;
  }

  public getDateEndValuation(event: Event){
    const target = event.target as HTMLInputElement;
    const dateValue = target.value;
    this.inputDateEndValuation = dateValue;
  }

  public generateDownloadUrl(): string {
    let baseUrl = `${this.url}/api/valuations/report`;
    let params = [];

    if (this.iduservaluator) {
        params.push(`valuator_uuid=${this.iduservaluator}`);
    }
    if (this.inputDateValuation) {
        params.push(`begin_date=${this.inputDateValuation}`);
    }
    if (this.inputDateEndValuation) {
      params.push(`end_date=${this.inputDateEndValuation}`)
    }

    return params.length ? `${baseUrl}?${params.join('&')}` : baseUrl;
}

}
