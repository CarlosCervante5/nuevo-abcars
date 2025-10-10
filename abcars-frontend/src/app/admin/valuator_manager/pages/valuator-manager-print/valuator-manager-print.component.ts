import { Component, ElementRef, ViewChild, type OnInit } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

import { environment } from '@environments/environment';
import { GetUsersByRol, UserTechnicians } from '@interfaces/admin.interfaces';

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

  constructor(
    private _valuatorManagerPrintService: ValuatorManagerPrintService
  ){}

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

  public getDateValuation(event: MatDatepickerInputEvent<Date>){
    let date = new Date(`${event.value}`);
    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    let year = date.getFullYear();
    if(month.length < 2) month = '0' + month;
    if(day.length < 2) day = '0' + day;

    let dateV = [year, month, day].join('-');
    this.dateValuation.nativeElement.value = dateV;
    this.inputDateValuation = dateV;
  }

  public getDateEndValuation(event: MatDatepickerInputEvent<Date>){
    let date = new Date(`${event.value}`);
    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    let year = date.getFullYear();
    if(month.length < 2) month = '0' + month;
    if(day.length < 2) day = '0' + day;

    let dateV = [year, month, day].join('-');

    this.dateEndValuation.nativeElement.value = dateV;
    this.inputDateEndValuation = dateV;

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
