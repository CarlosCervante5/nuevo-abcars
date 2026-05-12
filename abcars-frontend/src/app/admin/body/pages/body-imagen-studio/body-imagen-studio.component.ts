import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-body-imagen-studio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex flex-col">
      <header
        class="shrink-0 border-b border-slate-700 bg-slate-950/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3 flex-wrap">
          <a routerLink="/admin/body" class="text-sm font-semibold text-amber-400 hover:text-amber-300"
            >← Panel Body</a
          >
          <h1 class="text-base sm:text-lg font-bold text-white">Imagen Studio</h1>
          <span class="text-xs text-slate-400">Solo embellecer / evidencia (sin recorte)</span>
        </div>
        <p *ngIf="!safeStudioUrl" class="text-xs text-amber-200 max-w-xl">
          Configura <code class="bg-slate-800 px-1 rounded">imagenStudioUrl</code> en environment (URL de
          abcars-imagen-studio).
        </p>
      </header>
      <div class="flex-1 min-h-0 relative" *ngIf="safeStudioUrl as url">
        <iframe
          [src]="url"
          title="Imagen Studio — embellecer"
          class="absolute inset-0 w-full h-full border-0 bg-slate-900"
          loading="lazy"
        ></iframe>
      </div>
    </div>
  `,
})
export class BodyImagenStudioComponent implements OnInit {
  safeStudioUrl: SafeResourceUrl | null = null;

  constructor(private readonly sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    const raw = environment.imagenStudioUrl?.trim();
    if (!raw) {
      this.safeStudioUrl = null;
      return;
    }
    const base = raw.endsWith('/') ? raw : `${raw}/`;
    const sep = base.includes('?') ? '&' : '?';
    const withMode = `${base}${sep}mode=solo-embellecer`;
    this.safeStudioUrl = this.sanitizer.bypassSecurityTrustResourceUrl(withMode);
  }
}
