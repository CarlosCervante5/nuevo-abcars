import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppointmentsComponent } from './pages/appointments/appointments.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ChecklistComponent } from './pages/checklist/checklist.component';
import { QuoteSellCarRequestComponent } from './pages/quote-sell-car-request/quote-sell-car-request.component';
import { InventoryViewComponent } from './pages/inventory-view/inventory-view.component';
import { VehicleDetailViewComponent } from './pages/vehicle-detail-view/vehicle-detail-view.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'appointment', component: AppointmentsComponent},
  { path: 'inventory', component: InventoryViewComponent},
  { path: 'inventory/:uuid', component: VehicleDetailViewComponent},
  { path: 'checklist/:uuid_valuation', component: ChecklistComponent},
  { path: 'quote-request/:uuid_valuation', component: QuoteSellCarRequestComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ValuatorRoutingModule { }
