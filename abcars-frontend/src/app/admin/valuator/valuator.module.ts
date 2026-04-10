import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ValuatorRoutingModule } from './valuator-routing.module';
import { ValuatorAppointmentsPageModule } from './valuator-appointments-page.module';
import { AdminModule } from '../admin.module';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AngularMaterialModule } from 'src/app/angular-material/angular-material.module';
import { ChecklistComponent } from './pages/checklist/checklist.component';
import { ExternalRevisionPictureComponent } from './components/external-revision-picture/external-revision-picture.component';
import { InternalRevisionPictureComponent } from './components/internal-revision-picture/internal-revision-picture.component';
import { SparePartsFormComponent } from './components/spare-parts-form/spare-parts-form.component';
import { NewNavComponent } from 'src/app/shared/versiones-nav/new-nav/new-nav.component';
import { BodyworkPaintValuatorFormComponent } from './components/bodywork-paint-valuator-form/bodywork-paint-valuator-form.component';
import { QuoteSellCarRequestComponent } from './pages/quote-sell-car-request/quote-sell-car-request.component';
import { InventoryViewComponent } from './pages/inventory-view/inventory-view.component';
import { VehicleDetailViewComponent } from './pages/vehicle-detail-view/vehicle-detail-view.component';
import { SkCubeComponent } from "@components/sk-cube/sk-cube.component";
import { CommonModule } from '@angular/common';


@NgModule({
  declarations: [
    BodyworkPaintValuatorFormComponent,
    ChecklistComponent,
    DashboardComponent,
    ExternalRevisionPictureComponent,
    InternalRevisionPictureComponent,
    InventoryViewComponent,
    VehicleDetailViewComponent,
    QuoteSellCarRequestComponent,
    SparePartsFormComponent
  ],
  imports: [
    ValuatorAppointmentsPageModule,
    AdminModule,
    AngularMaterialModule,
    ValuatorRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NewNavComponent,
    SkCubeComponent
  ]
})
// export class AppointmentValuationsModule { }
export class ValuatorModule { }
