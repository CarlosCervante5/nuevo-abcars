import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { BodyRoutingModule } from './body-routing.module';
import { AdminModule } from '../admin.module';
import { AngularMaterialModule } from 'src/app/angular-material/angular-material.module';
import { NewNavComponent } from 'src/app/shared/versiones-nav/new-nav/new-nav.component';
import { BodyDashboardComponent } from './pages/dashboard/body-dashboard.component';
import { BodyHypOrdersListComponent } from './pages/body-hyp-orders-list/body-hyp-orders-list.component';
import { BodyHypOrderDialogComponent } from './components/body-hyp-order-dialog/body-hyp-order-dialog.component';

@NgModule({
  declarations: [BodyDashboardComponent, BodyHypOrdersListComponent, BodyHypOrderDialogComponent],
  imports: [
    AdminModule,
    AngularMaterialModule,
    BodyRoutingModule,
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NewNavComponent,
  ],
})
export class BodyModule {}
