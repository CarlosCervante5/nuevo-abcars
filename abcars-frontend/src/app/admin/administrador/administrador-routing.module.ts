import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardAdminComponent } from './pages/dashboard/dashboardAdmin.component';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { AdminPermisosComponent } from './pages/admin-permisos/admin-permisos.component';
import { AdminDealershipsComponent } from './pages/admin-dealerships/admin-dealerships.component';
import { DealershipsMapComponent } from './pages/dealerships-map/dealerships-map.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { ApiInfoComponent } from './pages/api-info/api-info.component';
import { DocumentationComponent } from './pages/documentation/documentation.component';
import { AssistantComponent } from './pages/assistant/assistant.component';

const routes: Routes = [
  { path: '', component: DashboardAdminComponent },
  { path: 'users', component: AdminUsersComponent },
  { path: 'permissions', component: AdminPermisosComponent },
  { path: 'dealerships', component: AdminDealershipsComponent },
  { path: 'dealerships-map', component: DealershipsMapComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'assistant', component: AssistantComponent },
  { path: 'api-info', component: ApiInfoComponent },
  { path: 'documentation', component: DocumentationComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministradorRoutingModule { }

