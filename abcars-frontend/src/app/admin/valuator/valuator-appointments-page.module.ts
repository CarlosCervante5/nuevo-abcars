import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from 'src/app/angular-material/angular-material.module';
import { AdminSharedModule } from '../admin-shared.module';
import { NewNavComponent } from 'src/app/shared/versiones-nav/new-nav/new-nav.component';
import { SkCubeComponent } from '@components/sk-cube/sk-cube.component';
import { AppointmentsComponent } from './pages/appointments/appointments.component';
import { AppointmentFormComponent } from './components/appointment-form/appointment-form.component';
import { DocumentationVehicleComponent } from './components/documentation-vehicle/documentation-vehicle.component';

/**
 * Citas de valuación (listado + bottom sheets): compartido entre ValuatorModule y AdministradorModule.
 */
@NgModule({
  declarations: [AppointmentsComponent, AppointmentFormComponent, DocumentationVehicleComponent],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    AdminSharedModule,
    AngularMaterialModule,
    NewNavComponent,
    SkCubeComponent
  ],
  exports: [AppointmentsComponent]
})
export class ValuatorAppointmentsPageModule {}
