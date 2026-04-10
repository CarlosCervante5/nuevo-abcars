import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppointmentManagerRoutingModule } from './appointment-manager-routing.module';
import { AppointmentAssignmentsModule } from './appointment-assignments.module';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AdminModule } from '../admin.module';
import { AngularMaterialModule } from 'src/app/angular-material/angular-material.module';
import { FormsModule } from '@angular/forms';
import { NewNavComponent } from 'src/app/shared/versiones-nav/new-nav/new-nav.component';


@NgModule({
  declarations: [DashboardComponent],
  imports: [
    AppointmentAssignmentsModule,
    AdminModule,
    AngularMaterialModule,
    CommonModule,
    AppointmentManagerRoutingModule,
    FormsModule,
    NewNavComponent
  ]
})
export class AppointmentManagerModule { }
