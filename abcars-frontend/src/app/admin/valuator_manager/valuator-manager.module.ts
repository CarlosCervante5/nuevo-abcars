import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ValuatorManagerRoutingModule } from './valuator-manager-routing.module';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AdminSharedModule } from '../admin-shared.module';
import { ValuatorManagerPrintComponent } from './pages/valuator-manager-print/valuator-manager-print.component';
import { AngularMaterialModule } from 'src/app/angular-material/angular-material.module';
import { ClientPriceOfferComponent } from './pages/client-price-offer/client-price-offer.component';


@NgModule({
  declarations: [
    ClientPriceOfferComponent,
    DashboardComponent,
    ValuatorManagerPrintComponent
  ],
  imports: [
    AdminSharedModule,
    AngularMaterialModule,
    CommonModule,
    ValuatorManagerRoutingModule
  ]
})
export class ValuatorManagerModule { }
