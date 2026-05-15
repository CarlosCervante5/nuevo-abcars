import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AdminModule } from "../admin.module";
import { AngularMaterialModule } from "src/app/angular-material/angular-material.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AdminShellComponent } from "./components/admin-shell/admin-shell.component";
import { AdministradorRoutingModule } from "./administrador-routing.module";
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { AdminPermisosComponent } from './pages/admin-permisos/admin-permisos.component';
import { AdminDealershipsComponent } from './pages/admin-dealerships/admin-dealerships.component';
import { DealershipsMapComponent } from './pages/dealerships-map/dealerships-map.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { ApiInfoComponent } from './pages/api-info/api-info.component';
import { DocumentationComponent } from './pages/documentation/documentation.component';
import { AssistantComponent } from './pages/assistant/assistant.component';
import { AddUserComponent } from './components/add-user/add-user.component';
import { SkCubeComponent } from "@components/sk-cube/sk-cube.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { UpdateUserComponent } from './components/update-user/update-user.component';
import { NewNavComponent } from "src/app/shared/versiones-nav/new-nav/new-nav.component";
import { AdminHomeDashboardComponent } from "./pages/admin-home-dashboard/admin-home-dashboard.component";
import { VehicleInventoryModule } from "../marketing/vehicle-inventory.module";
import { AppointmentAssignmentsModule } from "../appointment-manager/appointment-assignments.module";
import { ValuatorAppointmentsPageModule } from "../valuator/valuator-appointments-page.module";
import { DeliveryPhotosPageModule } from "../gestor/delivery-photos-page.module";
import { PromotionsPageModule } from "../gestor/promotions-page.module";
import { AdminMainBannerComponent } from "./pages/admin-main-banner/admin-main-banner.component";
import { AdminBrandsModelsComponent } from "./pages/admin-brands-models/admin-brands-models.component";
import { IntelimotorIntegrationComponent } from "./pages/intelimotor-integration/intelimotor-integration.component";
@NgModule({
    declarations: [
        AdminShellComponent,
        AdminUsersComponent,
        AdminPermisosComponent,
        AdminDealershipsComponent,
        AdminBrandsModelsComponent,
        DealershipsMapComponent,
        ApiInfoComponent,
        DocumentationComponent,
        AssistantComponent,
        AddUserComponent,
        UpdateUserComponent
    ],
    imports: [
        CommonModule,
        AngularMaterialModule,
        ReactiveFormsModule,
        AdminModule,
        AdministradorRoutingModule,
        SkCubeComponent,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        NewNavComponent,
        AdminHomeDashboardComponent,
        AnalyticsComponent,
        VehicleInventoryModule,
        AppointmentAssignmentsModule,
        ValuatorAppointmentsPageModule,
        DeliveryPhotosPageModule,
        PromotionsPageModule,
        AdminMainBannerComponent,
        IntelimotorIntegrationComponent
    ]
  })
  export class AdministradorModule { }
  