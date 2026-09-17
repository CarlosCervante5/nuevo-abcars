import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { SkCubeComponent } from '@components/sk-cube/sk-cube.component';
import { OverviewComponent } from './components/overview/overview.component';
import { AssistantFloatingComponent } from './components/assistant-floating/assistant-floating.component';
import { ValuationStatisticsOverviewComponent } from './components/valuation-statistics-overview/valuation-statistics-overview.component';

/**
 * Componentes compartidos del panel admin sin AdminRoutingModule.
 * Usar en módulos lazy (valuator, technician, …) para no registrar el wildcard ** → /404.
 */
@NgModule({
  declarations: [
    OverviewComponent,
    AssistantFloatingComponent,
    ValuationStatisticsOverviewComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AngularMaterialModule,
    SkCubeComponent
  ],
  exports: [
    OverviewComponent,
    AssistantFloatingComponent,
    ValuationStatisticsOverviewComponent,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    AngularMaterialModule
  ]
})
export class AdminSharedModule {}
