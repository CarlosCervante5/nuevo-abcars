import { Component, Input, OnInit } from '@angular/core';

// Interfaces
interface Links {
  label: string;
  page: string;
  link: string;
}

@Component({
    selector: 'app-products-customer',
    templateUrl: './products-customer.component.html',
    styles: [`
    ::ng-deep.mat-tab-link.mat-tab-label-active {
      color: black;
      opacity: 1 !important;
    }

    ::ng-deep.mat-tab-nav-bar.mat-primary .mat-ink-bar {
      background-color: #EEB838 !important;  
    }
  `],
    standalone: false
})

export class ProductsCustomerComponent implements OnInit {

  // Inputs
  @Input() page: string = '';

  // References Navegate
  public navLinks: Links[] = [
    {
      label: 'Mis autos',
      page: 'Cars',
      link: '/auth/mi-cuenta/autos'        
    }, 
    {
      label: 'Servicios',
      page: 'Services',
      link: '/auth/mi-cuenta/servicios'        
    }, 
    {
      label: 'Incidencias',
      page: 'Incidents',
      link: '/auth/mi-cuenta/incidencias'        
    },
    {
      label: 'Asistencias',
      page: 'Assists',
      link: '/auth/mi-cuenta/asistencias'        
    },
    {
      label: 'Financiamientos',
      page: 'Financings',
      link: '/auth/mi-cuenta/financiamientos'
    },
    {
      label: 'Recompensas',
      page: 'Rewards',
      link: '/auth/mi-cuenta/recompensas'        
    },
    {
      label: 'Apartados',
      page: 'Reserved',
      link: '/auth/mi-cuenta/apartados'        
    },
  ];

  constructor() { }

  ngOnInit(): void { }
}
