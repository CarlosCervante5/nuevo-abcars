import { Component, OnInit, Input } from '@angular/core';

// Interfaces
import { Incident } from '../../interfaces/incidents.interface';
@Component({
    selector: 'app-incidents-customer',
    templateUrl: './incidents-customer.component.html',
    styles: [`
    mat-form-field {
      width: 100%;
    }

    textarea {
      width: 100%;
    }

    .done {
      color: #0f5132 !important;
      background-color: #d1e7dd !important;
    }

    .process {      
      color: #084298 !important;
      background-color: #cfe2ff !important;
    }

    .close {      
      color: #842029 !important;
      background-color: #f8d7da !important;
    }
  `],
    standalone: false
})

export class IncidentsCustomerComponent implements OnInit {
  @Input() incident!:Incident;

  constructor() { }

  ngOnInit(): void {
  }

}
