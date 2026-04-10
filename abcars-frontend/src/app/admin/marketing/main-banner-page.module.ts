import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AngularMaterialModule } from 'src/app/angular-material/angular-material.module';
import { MainBannerComponent } from './components/main-banner/main-banner.component';

/**
 * Banner principal del home: reutilizable desde MarketingModule (bottom sheet) y AdministradorModule.
 */
@NgModule({
  declarations: [MainBannerComponent],
  imports: [CommonModule, RouterModule, FormsModule, AngularMaterialModule],
  exports: [MainBannerComponent]
})
export class MainBannerPageModule {}
