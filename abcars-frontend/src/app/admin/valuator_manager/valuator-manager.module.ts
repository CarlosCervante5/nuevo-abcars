import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ValuatorManagerRoutingModule } from './valuator-manager-routing.module';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AdminSharedModule } from '../admin-shared.module';
import { ValuatorManagerPrintPageModule } from './valuator-manager-print-page.module';
import { AngularMaterialModule } from 'src/app/angular-material/angular-material.module';
import { ClientPriceOfferComponent } from './pages/client-price-offer/client-price-offer.component';


@NgModule({
  declarations: [
    ClientPriceOfferComponent,
    DashboardComponent
  ],
  imports: [
    AdminSharedModule,
    AngularMaterialModule,
    CommonModule,
    ValuatorManagerPrintPageModule,
    ValuatorManagerRoutingModule
  ]
})
export class ValuatorManagerModule { }
