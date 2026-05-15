import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  StudioCatalogService,
  StudioCatalogSettings,
} from '@services/studio-catalog.service';
import {
  loadStudioCatalogBackgroundImage,
  renderDefaultStudioBackgroundBlob,
  STUDIO_CATALOG_DEFAULT_HEIGHT,
  STUDIO_CATALOG_DEFAULT_WIDTH,
} from '../../../../shared/utils/studio-catalog-background';

@Component({
  selector: 'app-studio-catalog-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './studio-catalog-settings.component.html',
  styleUrls: ['./studio-catalog-settings.component.css'],
})
export class StudioCatalogSettingsComponent implements OnInit {
  loading = true;
  saving = false;
  resetting = false;
  error: string | null = null;
  successMessage: string | null = null;
  settings: StudioCatalogSettings | null = null;
  previewUrl: string | null = null;
  selectedFile: File | null = null;

  /** Dimensiones usadas en vista previa, generación desde plantilla y guardado (sin editor canvas frágil). */
  composeWidth = STUDIO_CATALOG_DEFAULT_WIDTH;
  composeHeight = STUDIO_CATALOG_DEFAULT_HEIGHT;

  readonly defaultWidth = STUDIO_CATALOG_DEFAULT_WIDTH;
  readonly defaultHeight = STUDIO_CATALOG_DEFAULT_HEIGHT;

  constructor(private readonly studioCatalog: StudioCatalogService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    this.error = null;
    this.studioCatalog.invalidateCache();
    this.studioCatalog.getBackgroundSettings(true).subscribe({
      next: (response) => {
        this.settings = response.data;
        this.composeWidth = response.data.width ?? STUDIO_CATALOG_DEFAULT_WIDTH;
        this.composeHeight = response.data.height ?? STUDIO_CATALOG_DEFAULT_HEIGHT;
        void this.refreshPreview();
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la configuración del ciclorama.';
        this.loading = false;
      },
    });
  }

  /**
   * Vista previa = fondo escalado exactamente a composeWidth×composeHeight (igual que composición IA).
   * Evita `object-cover` en un `<img>` que recortaba el ciclorama al agrandar el contenedor.
   */
  async refreshPreview(): Promise<void> {
    if (this.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }

    if (this.selectedFile) {
      this.previewUrl = URL.createObjectURL(this.selectedFile);
      return;
    }

    this.clampComposeDimensions();

    const w = this.composeWidth;
    const h = this.composeHeight;

    const bgUrl =
      this.settings && !this.settings.using_default && this.settings.cyclorama_image_url?.trim()
        ? this.settings.cyclorama_image_url.trim()
        : null;

    try {
      const img = await loadStudioCatalogBackgroundImage(bgUrl);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        this.previewUrl = bgUrl;
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      this.previewUrl = canvas.toDataURL('image/jpeg', 0.88);
    } catch {
      this.previewUrl = bgUrl ?? null;
    }
  }

  clampComposeDimensions(): void {
    let w = Math.round(Number(this.composeWidth));
    let heightPx = Math.round(Number(this.composeHeight));
    if (!Number.isFinite(w)) {
      w = STUDIO_CATALOG_DEFAULT_WIDTH;
    }
    if (!Number.isFinite(heightPx)) {
      heightPx = STUDIO_CATALOG_DEFAULT_HEIGHT;
    }
    this.composeWidth = Math.min(4096, Math.max(640, w));
    this.composeHeight = Math.min(4096, Math.max(480, heightPx));
  }

  onComposeSizeChanged(): void {
    this.clampComposeDimensions();
    if (!this.selectedFile) {
      void this.refreshPreview();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;
    this.successMessage = null;
    this.error = null;
    void this.refreshPreview();
  }

  async generateFromTemplate(): Promise<void> {
    this.saving = true;
    this.error = null;
    this.successMessage = null;

    try {
      const blob = await renderDefaultStudioBackgroundBlob({
        width: this.composeWidth,
        height: this.composeHeight,
      });
      this.selectedFile = new File([blob], 'cyclorama-plantilla.jpg', { type: 'image/jpeg' });
      await this.refreshPreview();
      this.successMessage =
        'Vista previa generada desde la plantilla SVG. Pulsa «Guardar ciclorama maestro» para aplicarla a todo el inventario.';
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'No se pudo generar la plantilla.';
    } finally {
      this.saving = false;
    }
  }

  saveMaster(): void {
    if (!this.selectedFile) {
      this.error = 'Selecciona un JPG o genera uno desde la plantilla antes de guardar.';
      return;
    }

    this.saving = true;
    this.error = null;
    this.successMessage = null;

    this.clampComposeDimensions();

    this.studioCatalog
      .uploadBackground(this.selectedFile, this.composeWidth, this.composeHeight)
      .subscribe({
        next: (response) => {
          this.settings = response.data;
          this.composeWidth = response.data.width ?? this.composeWidth;
          this.composeHeight = response.data.height ?? this.composeHeight;
          this.selectedFile = null;
          this.studioCatalog.invalidateCache();
          void this.refreshPreview();
          this.successMessage = 'Ciclorama maestro guardado. Todas las fotos con IA usarán este fondo.';
          this.saving = false;
        },
        error: (err) => {
          this.error =
            (err as { error?: { message?: string } })?.error?.message ??
            'No se pudo guardar el ciclorama maestro.';
          this.saving = false;
        },
      });
  }

  resetToDefault(): void {
    if (!confirm('¿Restaurar la plantilla SVG por defecto? El JPG maestro en Cloudinary se eliminará.')) {
      return;
    }

    this.resetting = true;
    this.error = null;
    this.successMessage = null;

    this.studioCatalog.resetBackground().subscribe({
      next: (response) => {
        this.settings = response.data;
        this.selectedFile = null;
        this.studioCatalog.invalidateCache();
        void this.refreshPreview();
        this.successMessage = 'Se restauró el ciclorama por defecto (plantilla SVG).';
        this.resetting = false;
      },
      error: (err) => {
        this.error =
          (err as { error?: { message?: string } })?.error?.message ??
          'No se pudo restaurar el ciclorama por defecto.';
        this.resetting = false;
      },
    });
  }
}
