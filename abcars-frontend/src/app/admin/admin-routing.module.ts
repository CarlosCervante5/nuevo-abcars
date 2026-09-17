import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MarketingGuard } from './marketing/guards/marketing.guard';
import { GestorGuard } from './gestor/guards/gestor.guard';
import { ReceptionistGuard } from './receptionist/guards/receptionist.guard'; 
import { ValuatorGuard } from './valuator/guards/valuator.guard';
import { AdministradorGuard } from './administrador/guards/administrador.guard';
import { AppointmentManagerGuard } from './appointment-manager/guards/appointment_manager.guard';
import { BlogManagerGuard } from './blog-manager/guards/blog-manager.guard';
import { TechnicianGuard } from './technician/guards/technician.guard';
import { ValuationManagerGuard } from './valuator_manager/guards/valuation-manager.guard';
import { BodyworkPaintTechnicianGuard } from './bodywork-paint-technician/guards/bodywork-paint-technician.guard';
import { BodyGuard } from './body/guards/body.guard';
import { SparePartsGuard } from './spare-parts/guards/spare-parts.guard';


const routes: Routes = [  
  { path: 'marketing',
    loadChildren: () => import('./marketing/marketing.module').then(m => m.MarketingModule), 
    canActivate: [MarketingGuard],
    data: { requiredRole: 'marketing' } 
  },
  { path: 'blog_manager',
    loadChildren: () => import('./blog-manager/blog-manager.module').then(m => m.BlogManagerModule), 
    canActivate: [BlogManagerGuard],
    data: { requiredRole: 'blog_manager' } 
  }, 

  { path: 'gestor',
    loadChildren: () => import('./gestor/gestor.module').then( m => m.GestorModule),
    canActivate: [GestorGuard],
  },
  // { path: 'staff',
  //   loadChildren: () => import('./staff/staff.module').then( m => m.StaffModule),
  //   canActivate: [StaffGuard],
  //   canLoad: [StaffGuard],
  // },
  { path: 'receptionist',
    loadChildren: () => import('./receptionist/receptionist.module').then( m => m.ReceptionistModule),
    canActivate: [ReceptionistGuard],
  },
  { path: 'valuator',
    loadChildren: () => import('./valuator/valuator.module').then( m => m.ValuatorModule ),
    canActivate: [ValuatorGuard],
  },
  { path: 'seller',
    loadChildren: () => import('./valuator/valuator.module').then( m => m.ValuatorModule ),
    canActivate: [ValuatorGuard],
  },
  { path: 'technician',
    loadChildren: () => import('./technician/technician.module').then( m => m.TechnicianModule ),
    canActivate: [TechnicianGuard],
  },
  { path: 'valuation_manager',
    loadChildren: () => import('./valuator_manager/valuator-manager.module').then( m => m.ValuatorManagerModule),
    canActivate: [ValuationManagerGuard],
  },
  { path: 'appointment_manager',
    loadChildren: () => import('./appointment-manager/appointment-manager.module').then( m => m.AppointmentManagerModule ),
    canActivate: [AppointmentManagerGuard],
  },
  { path: 'administrator',
    loadChildren: () => import('./administrador/administrador.module').then( m => m.AdministradorModule),
    canActivate: [AdministradorGuard],
  },
  { path: 'bodywork_paint_technician',
    loadChildren: () => import('./bodywork-paint-technician/bodywork-paint-technician.module').then( m => m.BodyworkPaintTechnicianModule),
    canActivate: [BodyworkPaintTechnicianGuard],
  },
  { path: 'body',
    loadChildren: () => import('./body/body.module').then(m => m.BodyModule),
    canActivate: [BodyGuard],
  },
  { path: 'spare_parts',
    loadChildren: () => import('./spare-parts/spare-parts.module').then(m => m.SparePartsModule),
    canActivate: [SparePartsGuard],
  },
  { path: '**', redirectTo: '/404' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
