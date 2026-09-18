import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AngularMaterialModule } from 'src/app/angular-material/angular-material.module';
import { AdminSharedModule } from '../admin-shared.module';
import { ValuatorManagerPrintComponent } from './pages/valuator-manager-print/valuator-manager-print.component';

/**
 * Reporte / export Excel de valuaciones: compartido entre ValuatorManagerModule
 * y AdministradorModule (AdminShell).
 */
@NgModule({
  declarations: [ValuatorManagerPrintComponent],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    AdminSharedModule,
    AngularMaterialModule
  ],
  exports: [ValuatorManagerPrintComponent]
})
export class ValuatorManagerPrintPageModule {}
