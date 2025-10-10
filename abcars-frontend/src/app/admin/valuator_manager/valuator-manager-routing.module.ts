import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ValuatorManagerPrintComponent } from './pages/valuator-manager-print/valuator-manager-print.component';
import { ClientPriceOfferComponent } from './pages/client-price-offer/client-price-offer.component';

const routes: Routes = [
  { path: '', component: DashboardComponent},
  { path: 'print-valuation', component: ValuatorManagerPrintComponent},
  { path: 'client-price-offer', component: ClientPriceOfferComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ValuatorManagerRoutingModule { }
