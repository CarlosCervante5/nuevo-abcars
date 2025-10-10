import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Componentes standalone principales (no necesitan declaración)
// import { ModernNavComponent } from './shared/components/modern-nav/modern-nav.component';
// import { ModernFooterComponent } from './shared/components/modern-footer/modern-footer.component';
// import { TailwindDemoComponent } from './demo/tailwind-demo/tailwind-demo.component';

@NgModule({
  declarations: [
    AppComponent, // AppComponent es el único componente que necesita ser declarado aquí
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule, // Contiene las rutas
    RouterModule,     // Provee la directiva routerLink
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }