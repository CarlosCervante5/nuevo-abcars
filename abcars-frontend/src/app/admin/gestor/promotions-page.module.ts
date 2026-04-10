import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AngularMaterialModule } from 'src/app/angular-material/angular-material.module';
import { AdminModule } from '../admin.module';
import { NewNavComponent } from 'src/app/shared/versiones-nav/new-nav/new-nav.component';
import { PromotionsComponent } from './pages/promotions/promotions.component';
import { LoadImagesPromoComponent } from './components/load-images-promo/load-images-promo.component';
import { UpdateImagesComponent } from './components/update-images/update-images.component';
import { CreateCampaingComponent } from './components/create-campaing/create-campaing.component';

/**
 * Campañas y promociones: compartido entre GestorModule y AdministradorModule.
 */
@NgModule({
  declarations: [
    PromotionsComponent,
    LoadImagesPromoComponent,
    UpdateImagesComponent,
    CreateCampaingComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    AdminModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    NewNavComponent
  ],
  exports: [PromotionsComponent]
})
export class PromotionsPageModule {}
