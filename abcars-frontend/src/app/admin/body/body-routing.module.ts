import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BodyDashboardComponent } from './pages/dashboard/body-dashboard.component';
import { BodyHypOrdersListComponent } from './pages/body-hyp-orders-list/body-hyp-orders-list.component';
import { BodyImagenStudioComponent } from './pages/body-imagen-studio/body-imagen-studio.component';

const routes: Routes = [
  { path: '', component: BodyDashboardComponent },
  { path: 'ordenes', component: BodyHypOrdersListComponent },
  { path: 'imagen-studio', component: BodyImagenStudioComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BodyRoutingModule {}
