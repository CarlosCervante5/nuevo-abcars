import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-imagen-studio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex flex-col">
      <header class="shrink-0 border-b border-slate-700 bg-slate-950/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <a routerLink="/" class="text-sm font-semibold text-amber-400 hover:text-amber-300">← ABCars</a>
          <h1 class="text-base sm:text-lg font-bold text-white">Imagen Studio</h1>
        </div>
        <p *ngIf="!safeStudioUrl" class="text-xs text-amber-200 max-w-xl">
          Configura <code class="bg-slate-800 px-1 rounded">imagenStudioUrl</code> en
          <code class="bg-slate-800 px-1 rounded">environment</code> (p. ej. la URL donde corre
          <code class="bg-slate-800 px-1 rounded">npm run dev</code> de abcars-imagen-studio, típicamente
          http://localhost:5176/).
        </p>
      </header>
      <div class="flex-1 min-h-0 relative" *ngIf="safeStudioUrl as url">
        <iframe
          [src]="url"
          title="Imagen Studio — retoque con Gemini"
          class="absolute inset-0 w-full h-full border-0 bg-slate-900"
          loading="lazy"
        ></iframe>
      </div>
    </div>
  `,
})
export class ImagenStudioComponent {
  readonly safeStudioUrl: SafeResourceUrl | null;

  constructor(private readonly sanitizer: DomSanitizer) {
    const raw = environment.imagenStudioUrl?.trim();
    if (!raw) {
      this.safeStudioUrl = null;
      return;
    }
    const withSlash = raw.endsWith('/') ? raw : `${raw}/`;
    this.safeStudioUrl = this.sanitizer.bypassSecurityTrustResourceUrl(withSlash);
  }
}
