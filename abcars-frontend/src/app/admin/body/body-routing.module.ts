import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BodyDashboardComponent } from './pages/dashboard/body-dashboard.component';
import { BodyHypOrdersListComponent } from './pages/body-hyp-orders-list/body-hyp-orders-list.component';
const routes: Routes = [
  { path: '', component: BodyDashboardComponent },
  { path: 'ordenes', component: BodyHypOrdersListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BodyRoutingModule {}
