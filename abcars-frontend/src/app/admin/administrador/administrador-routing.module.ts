import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminShellComponent } from './components/admin-shell/admin-shell.component';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { AdminPermisosComponent } from './pages/admin-permisos/admin-permisos.component';
import { AdminDealershipsComponent } from './pages/admin-dealerships/admin-dealerships.component';
import { DealershipsMapComponent } from './pages/dealerships-map/dealerships-map.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { ApiInfoComponent } from './pages/api-info/api-info.component';
import { DocumentationComponent } from './pages/documentation/documentation.component';
import { AssistantComponent } from './pages/assistant/assistant.component';
import { AdminHomeDashboardComponent } from './pages/admin-home-dashboard/admin-home-dashboard.component';
import { VehiclesComponent } from '../marketing/pages/vehicles/vehicles.component';
import { VehicleInventoryGuard } from './guards/vehicle-inventory.guard';
import { AppointmentManagerComponent } from '../appointment-manager/pages/appointment-manager/appointment-manager.component';
import { AppointmentManagerGuard } from '../appointment-manager/guards/appointment_manager.guard';
import { AppointmentsComponent } from '../valuator/pages/appointments/appointments.component';
import { ValuatorGuard } from '../valuator/guards/valuator.guard';
import { DeliveryPhotosComponent } from '../gestor/pages/delivery-photos/delivery-photos.component';
import { GestorGuard } from '../gestor/guards/gestor.guard';
import { PromotionsComponent } from '../gestor/pages/promotions/promotions.component';
import { GestorPromotionsGuard } from './guards/gestor-promotions.guard';
import { AdminMainBannerComponent } from './pages/admin-main-banner/admin-main-banner.component';
import { MainBannerGuard } from './guards/main-banner.guard';
import { AdminBrandsModelsComponent } from './pages/admin-brands-models/admin-brands-models.component';

const routes: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    children: [
      { path: '', component: AdminHomeDashboardComponent, data: { embedInShell: true } },
      {
        path: 'vehicles',
        component: VehiclesComponent,
        canActivate: [VehicleInventoryGuard],
        data: { embedInShell: true }
      },
      {
        path: 'assing-valuations',
        component: AppointmentManagerComponent,
        canActivate: [AppointmentManagerGuard],
        data: { embedInShell: true }
      },
      {
        path: 'valuation-appointments',
        component: AppointmentsComponent,
        canActivate: [ValuatorGuard],
        data: { embedInShell: true }
      },
      {
        path: 'delivery-photos',
        component: DeliveryPhotosComponent,
        canActivate: [GestorGuard],
        data: { embedInShell: true }
      },
      {
        path: 'promotions',
        component: PromotionsComponent,
        canActivate: [GestorPromotionsGuard],
        data: { embedInShell: true }
      },
      { path: 'users', component: AdminUsersComponent, data: { embedInShell: true } },
      { path: 'permissions', component: AdminPermisosComponent, data: { embedInShell: true } },
      { path: 'dealerships', component: AdminDealershipsComponent, data: { embedInShell: true } },
      { path: 'brands-models', component: AdminBrandsModelsComponent, data: { embedInShell: true } },
      { path: 'dealerships-map', component: DealershipsMapComponent, data: { embedInShell: true } },
      {
        path: 'home-banner',
        component: AdminMainBannerComponent,
        canActivate: [MainBannerGuard],
        data: { embedInShell: true }
      },
      { path: 'analytics', component: AnalyticsComponent, data: { embedInShell: true } },
      { path: 'assistant', component: AssistantComponent, data: { embedInShell: true } },
      { path: 'api-info', component: ApiInfoComponent, data: { embedInShell: true } },
      { path: 'documentation', component: DocumentationComponent, data: { embedInShell: true } },
      { path: 'analytics-dashboard', redirectTo: 'analytics', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministradorRoutingModule { }

