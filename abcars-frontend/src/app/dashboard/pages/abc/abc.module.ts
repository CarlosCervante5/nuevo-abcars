import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

// Modules
import { AngularMaterialModule } from 'src/app/angular-material/angular-material.module';
import { AbcRoutingModule } from './abc-routing.module';

// Component
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FinancingFormComponent } from './components/financing-form/financing-form.component';

@NgModule({
  declarations: [
    FinancingFormComponent,
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AbcRoutingModule,
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})

export class AbcModule { }
