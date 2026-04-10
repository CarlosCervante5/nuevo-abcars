import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AngularMaterialModule } from 'src/app/angular-material/angular-material.module';
import { AdminModule } from '../admin.module';
import { DeliveryPhotosComponent } from './pages/delivery-photos/delivery-photos.component';

/**
 * Fotos de entregas: compartido entre GestorModule y AdministradorModule.
 */
@NgModule({
  declarations: [DeliveryPhotosComponent],
  imports: [CommonModule, RouterModule, FormsModule, AdminModule, AngularMaterialModule],
  exports: [DeliveryPhotosComponent]
})
export class DeliveryPhotosPageModule {}
