import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AngularMaterialModule } from 'src/app/angular-material/angular-material.module';
import { AdminModule } from '../admin.module';
import { NewNavComponent } from 'src/app/shared/versiones-nav/new-nav/new-nav.component';
import { AppointmentManagerComponent } from './pages/appointment-manager/appointment-manager.component';

/**
 * Listado de citas / asignación de valuadores: reutilizable desde AppointmentManagerModule
 * y AdministradorModule (dentro de AdminShell) sin duplicar la ruta lazy de appointment_manager.
 */
@NgModule({
  declarations: [AppointmentManagerComponent],
  imports: [
    CommonModule,
    RouterModule,
    AdminModule,
    AngularMaterialModule,
    FormsModule,
    NewNavComponent
  ],
  exports: [AppointmentManagerComponent]
})
export class AppointmentAssignmentsModule {}
