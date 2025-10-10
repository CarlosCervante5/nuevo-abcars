import { Component, LOCALE_ID, OnInit } from '@angular/core';

// Change location app
import localeESMX from "@angular/common/locales/es-MX";
import { registerLocaleData } from '@angular/common';
registerLocaleData(localeESMX);

@Component({
    selector: 'app-buy-customer',
    templateUrl: './buy-customer.component.html',
    providers: [
        { provide: LOCALE_ID, useValue: 'es-MX' }
    ],
    standalone: false
})

export class BuyCustomerComponent implements OnInit {

  // References
  public date = new Date();

  constructor() { }

  ngOnInit(): void {
  }

}
