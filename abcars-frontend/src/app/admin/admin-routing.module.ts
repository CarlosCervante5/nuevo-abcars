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


const routes: Routes = [  
  { path: 'marketing',
    loadChildren: () => import('./marketing/marketing.module').then(m => m.MarketingModule), 
    canActivate: [MarketingGuard],
    canLoad: [MarketingGuard],
    data: { requiredRole: 'marketing' } 
  },
  { path: 'blog_manager',
    loadChildren: () => import('./blog-manager/blog-manager.module').then(m => m.BlogManagerModule), 
    canActivate: [BlogManagerGuard],
    canLoad: [BlogManagerGuard],
    data: { requiredRole: 'blog_manager' } 
  }, 

  { path: 'gestor',
    loadChildren: () => import('./gestor/gestor.module').then( m => m.GestorModule),
    canActivate: [GestorGuard],
    canLoad: [GestorGuard],
  },
  // { path: 'staff',
  //   loadChildren: () => import('./staff/staff.module').then( m => m.StaffModule),
  //   canActivate: [StaffGuard],
  //   canLoad: [StaffGuard],
  // },
  { path: 'receptionist',
    loadChildren: () => import('./receptionist/receptionist.module').then( m => m.ReceptionistModule),
    canActivate: [ReceptionistGuard],
    canLoad: [ReceptionistGuard],
  },
  { path: 'valuator',
    loadChildren: () => import('./valuator/valuator.module').then( m => m.ValuatorModule ),
    canActivate: [ValuatorGuard],
    canLoad: [ValuatorGuard]
  },
  { path: 'technician',
    loadChildren: () => import('./technician/technician.module').then( m => m.TechnicianModule ),
    canActivate: [TechnicianGuard],
    canLoad: [TechnicianGuard]
  },
  { path: 'valuation_manager', 
    loadChildren: () => import('./valuator_manager/valuator-manager.module').then( m => m.ValuatorManagerModule)
  },
  { path: 'appointment_manager',
    loadChildren: () => import('./appointment-manager/appointment-manager.module').then( m => m.AppointmentManagerModule ),
    canActivate: [AppointmentManagerGuard],
    canLoad: [AppointmentManagerGuard]
  },
  { path: 'administrator',
    loadChildren: () => import('./administrador/administrador.module').then( m => m.AdministradorModule),
    canActivate: [AdministradorGuard],
    canLoad: [AdministradorGuard],
  },
  { path: 'bodywork_paint_technician',
    loadChildren: () => import('./bodywork-paint-technician/bodywork-paint-technician.module').then( m => m.BodyworkPaintTechnicianModule)
  },
  { path: 'spare_parts',
    loadChildren: () => import('./spare-parts/spare-parts.module').then(m => m.SparePartsModule)
  },
  { path: '**', redirectTo: '404' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
