import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { CompraTuAutoComponent } from './pages/compra-tu-auto/compra-tu-auto.component';
import { DetailComponent } from './pages/detail/detail.component';
import { AcquisitionFormComponent } from './pages/acquisition-form/acquisition-form.component';

const routes: Routes = [
  { path: '', component: CompraTuAutoComponent },
  { path: 'detail/:uuid', component: DetailComponent },
  { path: ':marca/:modelo/:carroceria/:version/:anio/:minprecio/:maxprecio/:estado/:busqueda/:transmision/:exterior_color/:interior_color/:pagina', component: CompraTuAutoComponent },  
  { path: 'acquisition/vehicle/:method/:vin', component: AcquisitionFormComponent },
  { path: '**', pathMatch: 'full', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class ComprarAutosRoutingModule { }
