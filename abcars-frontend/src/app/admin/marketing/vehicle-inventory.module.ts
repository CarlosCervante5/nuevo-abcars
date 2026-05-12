import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from 'src/app/angular-material/angular-material.module';
import { AdminModule } from '../admin.module';
import { SkCubeComponent } from '@components/sk-cube/sk-cube.component';
import { NewNavComponent } from 'src/app/shared/versiones-nav/new-nav/new-nav.component';
import { VehiclesComponent } from './pages/vehicles/vehicles.component';
import { UpdateVehicleComponent } from './components/update-vehicle/update-vehicle.component';
import { StoreVehicleComponent } from './components/store-vehicle/store-vehicle.component';
import { AVehicleComponent } from './components/a-vehicle/a-vehicle.component';

/**
 * Inventario de vehículos (admin): reutilizable desde MarketingModule y AdministradorModule
 * sin duplicar rutas de marketing.
 */
@NgModule({
  declarations: [
    VehiclesComponent,
    UpdateVehicleComponent,
    StoreVehicleComponent,
    AVehicleComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AdminModule,
    DragDropModule,
    SkCubeComponent,
    NewNavComponent,
  ],
  exports: [VehiclesComponent]
})
export class VehicleInventoryModule {}
