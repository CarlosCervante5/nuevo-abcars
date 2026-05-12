import { Component, HostListener, OnDestroy } from '@angular/core';
import { Overview } from '@interfaces/admin.interfaces';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GeminiVehicleImageService } from '@services/gemini-vehicle-image.service';
import type { HypEvidencePromptId } from '../../../../shared/constants/hyp-evidence-prompts';

type EvidenceRow = {
  file: File;
  previewUrl: string;
  result?: File;
  resultUrl?: string;
};

@Component({
  selector: 'app-hyp-evidence-processor',
  templateUrl: './hyp-evidence-processor.component.html',
  styleUrls: ['./hyp-evidence-processor.component.css'],
  standalone: false,
})
export class HypEvidenceProcessorComponent implements OnDestroy {
  /** `null` hasta que el usuario elija el tipo (como Imagen Studio). */
  variant: HypEvidencePromptId | null = null;
  rows: EvidenceRow[] = [];
  processing = false;
  progressCurrent = 0;
  progressTotal = 0;
  /** Resaltado visual al arrastrar archivos sobre la zona de soltar. */
  dragOver = false;
  /** Índice en `rows` de la fila mostrada en el modal de vista previa. */
  previewRowIndex: number | null = null;
  /** Vista previa en modal para no alargar la página con muchas fotos. */
  previewModalOpen = false;

  get hasAnyResult(): boolean {
    return this.rows.some((r) => !!r.result);
  }

  get resultRowIndices(): number[] {
    return this.rows.map((r, i) => (r.resultUrl ? i : -1)).filter((i) => i >= 0);
  }

  get previewRow(): EvidenceRow | null {
    if (this.previewRowIndex === null || this.previewRowIndex < 0 || this.previewRowIndex >= this.rows.length) {
      return null;
    }
    const r = this.rows[this.previewRowIndex];
    return r?.resultUrl ? r : null;
  }

  itemOverview: Overview;

  constructor(
    private readonly gemini: GeminiVehicleImageService,
    private readonly snack: MatSnackBar,
  ) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.itemOverview = {
        user: {
          name: user.name || user.nickname || 'Usuario',
          surname: user.surname || '',
          role: 'Bodywork Paint Technician',
          email: user.email || '',
          picturepath: '',
        },
        pages: [
          {
            title: 'Citas de valuación HyP',
            icon: 'fi fi-rr-car',
            permalink: '/admin/bodywork_paint_technician/bodywork-paint',
          },
          {
            title: 'Evidencia fotográfica (IA)',
            icon: 'fi fi-rr-picture',
            permalink: '/admin/bodywork_paint_technician/evidencia-ia',
          },
        ],
      };
    } catch {
      this.itemOverview = {
        user: {
          name: 'Usuario',
          surname: '',
          role: 'Bodywork Paint Technician',
          email: '',
          picturepath: '',
        },
        pages: [
          {
            title: 'Citas de valuación HyP',
            icon: 'fi fi-rr-car',
            permalink: '/admin/bodywork_paint_technician/bodywork-paint',
          },
          {
            title: 'Evidencia fotográfica (IA)',
            icon: 'fi fi-rr-picture',
            permalink: '/admin/bodywork_paint_technician/evidencia-ia',
          },
        ],
      };
    }
  }

  ngOnDestroy(): void {
    this.revokeRowUrls();
  }

  onFilesSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.appendImageFiles(input.files);
    input.value = '';
  }

  onDropZoneLabelClick(ev: MouseEvent): void {
    if (this.variant || this.processing) {
      return;
    }
    ev.preventDefault();
    this.snack.open('Selecciona primero el tipo de corrección arriba.', 'Cerrar', { duration: 4000 });
  }

  /** Añade a la cola solo archivos de imagen (mismo criterio que el input `accept="image/*"`). */
  appendImageFiles(list: FileList | null): void {
    if (!this.variant) {
      this.snack.open('Selecciona primero el tipo de corrección antes de añadir imágenes.', 'Cerrar', {
        duration: 4500,
      });
      return;
    }
    if (!list?.length) {
      return;
    }
    let added = 0;
    for (let i = 0; i < list.length; i++) {
      const file = list.item(i)!;
      if (!file.type.startsWith('image/')) {
        continue;
      }
      this.rows.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
      added++;
    }
    if (added === 0) {
      this.snack.open('Suelta solo archivos de imagen (JPEG, PNG, WebP, etc.).', 'Cerrar', {
        duration: 4500,
      });
    }
  }

  openPreviewAt(i: number): void {
    const row = this.rows[i];
    if (!row?.resultUrl) {
      return;
    }
    this.previewRowIndex = i;
    this.previewModalOpen = true;
  }

  closePreviewModal(): void {
    this.previewModalOpen = false;
    this.previewRowIndex = null;
  }

  onPreviewBackdropClick(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) {
      this.closePreviewModal();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeClosePreview(): void {
    if (this.previewModalOpen) {
      this.closePreviewModal();
    }
  }

  advancePreview(delta: number): void {
    const idx = this.resultRowIndices;
    if (!idx.length) {
      this.previewRowIndex = null;
      this.previewModalOpen = false;
      return;
    }
    let pos = this.previewRowIndex !== null ? idx.indexOf(this.previewRowIndex) : 0;
    if (pos < 0) {
      pos = 0;
    }
    pos = (pos + delta + idx.length) % idx.length;
    this.previewRowIndex = idx[pos]!;
  }

  onDropZoneDragOver(ev: DragEvent): void {
    if (!this.variant || this.processing) {
      ev.preventDefault();
      if (ev.dataTransfer) {
        ev.dataTransfer.dropEffect = 'none';
      }
      this.dragOver = false;
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    if (ev.dataTransfer) {
      ev.dataTransfer.dropEffect = 'copy';
    }
    this.dragOver = true;
  }

  onDropZoneDragLeave(ev: DragEvent): void {
    const next = ev.relatedTarget as Node | null;
    const el = ev.currentTarget as HTMLElement;
    if (next && el.contains(next)) {
      return;
    }
    this.dragOver = false;
  }

  onDropZoneDrop(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.dragOver = false;
    if (this.processing) {
      return;
    }
    if (!this.variant) {
      this.snack.open('Selecciona primero el tipo de corrección arriba.', 'Cerrar', { duration: 4000 });
      return;
    }
    const files = ev.dataTransfer?.files ?? null;
    this.appendImageFiles(files);
  }

  clearQueue(): void {
    this.previewRowIndex = null;
    this.previewModalOpen = false;
    this.revokeRowUrls();
    this.rows = [];
  }

  removeRow(index: number): void {
    const r = this.rows[index];
    if (r) {
      URL.revokeObjectURL(r.previewUrl);
      if (r.resultUrl) URL.revokeObjectURL(r.resultUrl);
    }
    this.rows.splice(index, 1);
    if (this.previewRowIndex !== null) {
      if (this.previewRowIndex === index) {
        this.previewRowIndex = this.resultRowIndices[0] ?? null;
      } else if (this.previewRowIndex > index) {
        this.previewRowIndex--;
      }
    }
    if (this.previewModalOpen && (this.previewRowIndex === null || !this.rows[this.previewRowIndex]?.resultUrl)) {
      this.previewModalOpen = false;
      this.previewRowIndex = null;
    }
  }

  async processAll(): Promise<void> {
    if (!this.variant) {
      this.snack.open('Selecciona el tipo de corrección.', 'Cerrar', { duration: 3500 });
      return;
    }
    if (!this.rows.length) {
      this.snack.open('Agrega al menos una imagen.', 'Cerrar', { duration: 3500 });
      return;
    }
    if (!this.gemini.isConfigured()) {
      this.snack.open(
        'No hay clave de Gemini configurada (environment.geminiApiKey).',
        'Cerrar',
        { duration: 6000 },
      );
      return;
    }
    this.processing = true;
    this.progressCurrent = 0;
    this.progressTotal = this.rows.length;
    this.previewRowIndex = null;
    this.previewModalOpen = false;
    for (const row of this.rows) {
      if (row.resultUrl) {
        URL.revokeObjectURL(row.resultUrl);
        row.resultUrl = undefined;
        row.result = undefined;
      }
    }
    try {
      const files = this.rows.map((r) => r.file);
      const out = await this.gemini.processHypEvidenceFiles(
        files,
        this.variant!,
        (cur, tot) => {
          this.progressCurrent = cur;
          this.progressTotal = tot;
        },
      );
      out.forEach((file, i) => {
        const row = this.rows[i];
        if (!row) return;
        row.result = file;
        row.resultUrl = URL.createObjectURL(file);
      });
      this.snack.open('Listo. Puedes descargar los resultados.', 'Cerrar', {
        duration: 4000,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al procesar.';
      this.snack.open(msg, 'Cerrar', { duration: 8000 });
    } finally {
      this.processing = false;
      this.progressCurrent = 0;
      this.progressTotal = 0;
    }
  }

  downloadFile(file: File): void {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  downloadAll(): void {
    const withResult = this.rows.filter((r) => r.result);
    if (!withResult.length) return;
    let delay = 0;
    for (const r of withResult) {
      if (!r.result) continue;
      const f = r.result;
      window.setTimeout(() => this.downloadFile(f), delay);
      delay += 400;
    }
  }

  private revokeRowUrls(): void {
    for (const r of this.rows) {
      URL.revokeObjectURL(r.previewUrl);
      if (r.resultUrl) URL.revokeObjectURL(r.resultUrl);
    }
  }
}
