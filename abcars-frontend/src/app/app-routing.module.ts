import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './shared/not-found/not-found.component';
import { TailwindDemoComponent } from './demo/tailwind-demo/tailwind-demo.component';
import { ModernHomeComponent } from './modern-home/modern-home.component';
import { InventoryComponent } from './inventory/inventory.component';
import { VehicleDetailComponent } from './pages/vehicle-detail/vehicle-detail.component';
import { FinancingComponent } from './pages/services/financing/financing.component';
import { InsuranceComponent } from './pages/services/insurance/insurance.component';
import { TechnicalServiceComponent } from './pages/services/technical-service/technical-service.component';
import { PartsComponent } from './pages/services/parts/parts.component';
import { ValuationComponent } from './pages/services/valuation/valuation.component';
import { ServicesComponent } from './pages/services/services.component';
import { PrivacidadDeUsoComponent } from './pages/externals/privacidad-de-uso/privacidad-de-uso.component';
import { TerminosYCondicionesComponent } from './pages/externals/terminos-y-condiciones/terminos-y-condiciones.component';
import { ScrollTopGuard } from './shared/guards/scroll-top.guard';

const routes: Routes = [
  // Ruta principal apunta al nuevo showroom moderno
  {
    path: '',
    component: ModernHomeComponent,
    canActivate: [ScrollTopGuard]
  },
  {
    path: 'showroom',
    component: ModernHomeComponent,
    canActivate: [ScrollTopGuard]
  },
  {
    path: 'tailwind-demo',
    component: TailwindDemoComponent,
    canActivate: [ScrollTopGuard]
  },
  {
    path: 'inventario',
    component: InventoryComponent,
    canActivate: [ScrollTopGuard]
  },
  {
    path: 'vehiculo/:id',
    component: VehicleDetailComponent,
    canActivate: [ScrollTopGuard]
  },
  {
    path: 'servicios',
    component: ServicesComponent,
    canActivate: [ScrollTopGuard]
  },
  
  // Rutas de servicios
  {
    path: 'financiamiento',
    component: FinancingComponent,
    canActivate: [ScrollTopGuard]
  },
  {
    path: 'seguros',
    component: InsuranceComponent,
    canActivate: [ScrollTopGuard]
  },
  {
    path: 'servicio-tecnico',
    component: TechnicalServiceComponent,
    canActivate: [ScrollTopGuard]
  },
  {
    path: 'refacciones',
    component: PartsComponent,
    canActivate: [ScrollTopGuard]
  },
  {
    path: 'valuacion',
    component: ValuationComponent,
    canActivate: [ScrollTopGuard]
  },
  
  // Rutas externas
  {
    path: 'externals/privacidad-de-uso',
    component: PrivacidadDeUsoComponent,
    canActivate: [ScrollTopGuard]
  },
  {
    path: 'externals/terminos-y-condiciones',
    component: TerminosYCondicionesComponent,
    canActivate: [ScrollTopGuard]
  },
  
  // Rutas de administración
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  
  // Rutas de autenticación
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  
  // Ruta para manejar el 404
  {
    path: '404',
    component: NotFoundComponent,
    canActivate: [ScrollTopGuard]
  },

  // Cualquier otra ruta redirige a 404
  {
    path: '**',
    redirectTo: '404'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }