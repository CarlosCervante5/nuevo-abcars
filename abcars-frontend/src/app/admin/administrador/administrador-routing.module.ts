import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardAdminComponent } from './pages/dashboard/dashboardAdmin.component';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { AdminPermisosComponent } from './pages/admin-permisos/admin-permisos.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { ApiInfoComponent } from './pages/api-info/api-info.component';
import { DocumentationComponent } from './pages/documentation/documentation.component';

const routes: Routes = [
  { path: '', component: DashboardAdminComponent },
  { path: 'users', component: AdminUsersComponent },
  { path: 'permissions', component: AdminPermisosComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'api-info', component: ApiInfoComponent },
  { path: 'documentation', component: DocumentationComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministradorRoutingModule { }

