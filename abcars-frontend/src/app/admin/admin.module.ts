import { NgModule } from '@angular/core';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminSharedModule } from './admin-shared.module';

/** Carga raíz bajo /admin: rutas + reexport de UI compartida. */
@NgModule({
  imports: [AdminSharedModule, AdminRoutingModule],
  exports: [AdminSharedModule]
})
export class AdminModule {}
