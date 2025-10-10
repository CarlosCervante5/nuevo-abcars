import { Component, type OnInit } from '@angular/core';

import { ValuatorManagerPrintService } from '@services/valuator-manager-print.service';

@Component({
  selector: 'app-valuation-statistics-overview',
  // imports: [],
  templateUrl: './valuation-statistics-overview.component.html',
  styleUrl: './valuation-statistics-overview.component.css',
  standalone: false
})
export class ValuationStatisticsOverviewComponent implements OnInit {

  public currentMonth: string | undefined;
  public checklist_ready: number = 0;
  public to_appraise: number = 0;
  public valuated: number = 0;

  constructor(
    private _valuatorManagerPrint: ValuatorManagerPrintService
  ){}

  ngOnInit(): void { 
    const currentDate = new Date();
    this.currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    this.getStatisticalAccount();
  }

  public getStatisticalAccount(){
    this._valuatorManagerPrint.getStatisticalAccount()
    .subscribe({
      next: (resp) => {
        if (resp.status === 200) {
          this.checklist_ready = resp.data.checklist_ready;
          this.to_appraise = resp.data.to_appraise;
          this.valuated = resp.data.valuated;
        }
      }
    });
  }

}
