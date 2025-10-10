import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { FinancingFormComponent } from './components/financing-form/financing-form.component';

const routes: Routes = [
  { path: 'financiamiento/solicitud/credit', component: FinancingFormComponent },
  { path: 'financiamiento/solicitud/credit/:vin', component: FinancingFormComponent },
  { path: '**', pathMatch: 'full', redirectTo: 'financiamiento/solicitud/credit' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class AbcRoutingModule { }
