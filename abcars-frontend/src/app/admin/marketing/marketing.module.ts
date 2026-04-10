import { NgModule } from '@angular/core';

import { MarketingRoutingModule } from './marketing-routing.module';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AdminModule } from '../admin.module';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SkCubeComponent } from '@components/sk-cube/sk-cube.component'
import { NewNavComponent } from 'src/app/shared/versiones-nav/new-nav/new-nav.component';
import { CommonModule } from '@angular/common';
import { VehicleInventoryModule } from './vehicle-inventory.module';
import { MainBannerPageModule } from './main-banner-page.module';

@NgModule({
  declarations: [DashboardComponent],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    MarketingRoutingModule,
    AdminModule,
    ReactiveFormsModule,
    SkCubeComponent,
    NewNavComponent,
    VehicleInventoryModule,
    MainBannerPageModule
  ]
})
export class MarketingModule { }
