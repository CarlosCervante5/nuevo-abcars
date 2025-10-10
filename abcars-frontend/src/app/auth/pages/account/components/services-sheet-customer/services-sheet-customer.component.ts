import { Component, Inject, LOCALE_ID } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

// Change locale
import localeEs from "@angular/common/locales/es";
import { registerLocaleData } from "@angular/common";
registerLocaleData(localeEs, 'es');

// Interfaces
import { Quote } from '../../interfaces/services.interface';


@Component({
    selector: 'app-services-sheet-customer',
    templateUrl: './services-sheet-customer.component.html',
    providers: [
        { provide: LOCALE_ID, useValue: 'es' }
    ],
    standalone: false
})

export class ServicesSheetCustomerComponent {

  // References of Quotes
  public quotes: Quote[] = [];

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: any,) { 
    // Assing quotes         
    this.quotes = this.data.quotes;    
  }

}
