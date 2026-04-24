import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { forkJoin } from 'rxjs';
import { AdminService } from '@services/admin.service';
import {
  findExactBrandMatch,
  findFuzzySimilarBrand,
  suggestBrandsByName
} from '@helpers/brand-suggest.helper';
import {
  AdminBrandLineRow,
  AdminInventoryBrand,
  AdminLineModelRow,
  GralResponse
} from '@interfaces/admin.interfaces';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-brands-models',
  templateUrl: './admin-brands-models.component.html',
  styleUrls: ['./admin-brands-models.component.css'],
  standalone: false
})
export class AdminBrandsModelsComponent implements OnInit {
  brands: AdminInventoryBrand[] = [];
  brandLines: AdminBrandLineRow[] = [];
  lineModels: AdminLineModelRow[] = [];

  loading = true;
  modelFilterBrandId: number | null = null;
  /** Valor del select "Ver por marca" (string para ngModel) */
  modelFilterSelect = '';
  /** Búsqueda de texto en la tabla de modelos (nombre, año, línea, marca) */
  modelListSearch = '';

  /** Filtro / paginación — marcas */
  brandListSearch = '';
  brandPageIndex = 0;
  brandPageSize = 10;
  readonly brandPageSizeOptions: number[] = [10, 25, 50, 100];

  /** Filtro / paginación — líneas de marca */
  lineListSearch = '';
  lineListBrandFilter: string = '';
  linePageIndex = 0;
  linePageSize = 10;
  readonly linePageSizeOptions: number[] = [10, 25, 50, 100];

  /** Paginación — modelos (el filtro por marca ya existía) */
  modelListPageIndex = 0;
  modelListPageSize = 10;
  readonly modelListPageSizeOptions: number[] = [10, 25, 50, 100];

  isCreatingBrand = false;
  editingBrandId: number | null = null;
  brandForm: { name: string; image_path: string } = { name: '', image_path: '' };

  isCreatingModel = false;
  editingModelId: number | null = null;
  modelForm: {
    name: string;
    year: string;
    line_id: string;
    image_path: string;
    filterBrandId: string;
  } = { name: '', year: '', line_id: '', image_path: '', filterBrandId: '' };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  /** Asegura id de API (string/number) → número; evita `NaN` y formularios que no se abren. */
  private parseRowId(v: unknown, label: string): number | null {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isInteger(n) || n < 1) {
      console.error(`[admin-brands-models] id inválido en ${label}`, v);
      return null;
    }
    return n;
  }

  private scrollToForm(anchor: string): void {
    setTimeout(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      brands: this.adminService.getInventoryBrands(),
      lines: this.adminService.getBrandLinesForInventory(),
      models: this.adminService.getLineModelsForInventory()
    }).subscribe({
      next: (res) => {
        this.brands = res.brands.data?.vehicle_brands ?? [];
        this.brandLines = res.lines.data?.brand_lines ?? [];
        this.lineModels = res.models.data?.line_models ?? [];
        this.loading = false;
        this.brandPageIndex = 0;
        this.linePageIndex = 0;
        this.modelListPageIndex = 0;
        this.recomputeSortedBrandLines();
        this.recomputeSortedModels();
      },
      error: () => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el catálogo de marcas y modelos.'
        });
      }
    });
  }

  private sortedModelRows: AdminLineModelRow[] = [];

  /** Líneas de marca (brand_lines), ordenadas para la tabla. */
  sortedBrandLines: AdminBrandLineRow[] = [];

  private recomputeSortedBrandLines(): void {
    this.sortedBrandLines = [...this.brandLines].sort((a, b) => {
      const an = (this.brandName(a.brand_id) + a.name).toLowerCase();
      const bn = (this.brandName(b.brand_id) + b.name).toLowerCase();
      return an.localeCompare(bn);
    });
  }

  private recomputeSortedModels(): void {
    this.sortedModelRows = [...this.lineModels].sort((a, b) => {
      const an = (this.brandName(a.brand_id) + a.name).toLowerCase();
      const bn = (this.brandName(b.brand_id) + b.name).toLowerCase();
      return an.localeCompare(bn);
    });
  }

  get filteredModels(): AdminLineModelRow[] {
    if (this.modelFilterBrandId == null) {
      return this.sortedModelRows;
    }
    return this.sortedModelRows.filter(
      (m) => m.brand_id === this.modelFilterBrandId
    );
  }

  /** Modelos: filtro por marca + búsqueda de texto. */
  get modelRowsFiltered(): AdminLineModelRow[] {
    const q = (this.modelListSearch || '').trim().toLowerCase();
    if (!q) {
      return this.filteredModels;
    }
    return this.filteredModels.filter((m) => {
      const y = String(m.year ?? '');
      return (
        (m.name || '').toLowerCase().includes(q) ||
        y.toLowerCase().includes(q) ||
        this.brandName(m.brand_id).toLowerCase().includes(q) ||
        this.lineName(m.line_id).toLowerCase().includes(q)
      );
    });
  }

  get modelRowsPaged(): AdminLineModelRow[] {
    return this.applyPage(
      this.modelRowsFiltered,
      this.modelListPageIndex,
      this.modelListPageSize
    );
  }

  get sortedBrandsList(): AdminInventoryBrand[] {
    return [...this.brands].sort((a, b) =>
      this.formatBrandName(a.name).localeCompare(this.formatBrandName(b.name), 'es', {
        sensitivity: 'base'
      })
    );
  }

  get brandRowsFiltered(): AdminInventoryBrand[] {
    const q = (this.brandListSearch || '').trim().toLowerCase();
    if (!q) {
      return this.sortedBrandsList;
    }
    return this.sortedBrandsList.filter((b) => {
      const n = (b.name || '').toLowerCase();
      const img = (b.image_path || '').toLowerCase();
      return n.includes(q) || img.includes(q);
    });
  }

  get brandRowsPaged(): AdminInventoryBrand[] {
    return this.applyPage(
      this.brandRowsFiltered,
      this.brandPageIndex,
      this.brandPageSize
    );
  }

  get lineRowsFiltered(): AdminBrandLineRow[] {
    let rows = this.sortedBrandLines;
    const brandSel = this.lineListBrandFilter ? Number(this.lineListBrandFilter) : NaN;
    if (Number.isInteger(brandSel) && brandSel > 0) {
      rows = rows.filter((l) => l.brand_id === brandSel);
    }
    const q = (this.lineListSearch || '').trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter((l) => {
      const n = (l.name || '').toLowerCase();
      const img = (l.image_path || '').toLowerCase();
      const brand = this.brandName(l.brand_id).toLowerCase();
      return n.includes(q) || img.includes(q) || brand.includes(q);
    });
  }

  get lineRowsPaged(): AdminBrandLineRow[] {
    return this.applyPage(
      this.lineRowsFiltered,
      this.linePageIndex,
      this.linePageSize
    );
  }

  private applyPage<T>(data: T[], pageIndex: number, pageSize: number): T[] {
    if (pageSize <= 0) {
      return data;
    }
    const total = data.length;
    const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1);
    const idx = Math.min(pageIndex, maxPage);
    const start = idx * pageSize;
    return data.slice(start, start + pageSize);
  }

  onBrandListFilterChange(): void {
    this.brandPageIndex = 0;
  }

  onBrandPage(e: PageEvent): void {
    this.brandPageIndex = e.pageIndex;
    this.brandPageSize = e.pageSize;
  }

  onLineListFilterChange(): void {
    this.linePageIndex = 0;
  }

  onLinePage(e: PageEvent): void {
    this.linePageIndex = e.pageIndex;
    this.linePageSize = e.pageSize;
  }

  onModelListFilterChange(): void {
    this.modelListPageIndex = 0;
  }

  onModelPage(e: PageEvent): void {
    this.modelListPageIndex = e.pageIndex;
    this.modelListPageSize = e.pageSize;
  }

  /** Incluidos para alinear [pageIndex] de mat-paginator cuando el total baja. */
  get brandPaginatorIndex(): number {
    return this.clampedPageIndex(
      this.brandPageIndex,
      this.brandRowsFiltered.length,
      this.brandPageSize
    );
  }

  get linePaginatorIndex(): number {
    return this.clampedPageIndex(
      this.linePageIndex,
      this.lineRowsFiltered.length,
      this.linePageSize
    );
  }

  get modelPaginatorIndex(): number {
    return this.clampedPageIndex(
      this.modelListPageIndex,
      this.modelRowsFiltered.length,
      this.modelListPageSize
    );
  }

  private clampedPageIndex(
    current: number,
    totalItems: number,
    pageSize: number
  ): number {
    if (totalItems === 0 || pageSize <= 0) {
      return 0;
    }
    const maxP = Math.max(0, Math.ceil(totalItems / pageSize) - 1);
    return Math.min(Math.max(0, current), maxP);
  }

  // --- Marcas ---

  startCreateBrand(): void {
    this.isCreatingBrand = true;
    this.editingBrandId = null;
    this.brandForm = { name: '', image_path: '' };
    this.scrollToForm('bm-form-brand');
  }

  startEditBrand(b: AdminInventoryBrand): void {
    const id = this.parseRowId(b.id, 'marca');
    if (id == null) {
      void Swal.fire({
        icon: 'error',
        title: 'No se puede editar',
        text: 'El catálogo no trajo un identificador válido para esta marca. Recarga la página e inténtalo de nuevo.'
      });
      return;
    }
    this.isCreatingBrand = false;
    this.editingBrandId = id;
    this.brandForm = {
      name: this.formatBrandName(b.name),
      image_path: b.image_path ?? ''
    };
    this.scrollToForm('bm-form-brand');
  }

  cancelBrandForm(): void {
    this.isCreatingBrand = false;
    this.editingBrandId = null;
    this.brandForm = { name: '', image_path: '' };
  }

  /** Sugerencias mientras se escribe el nombre (mismo catálogo, sin duplicar mal tipeado). */
  get brandNameSuggestions(): AdminInventoryBrand[] {
    return suggestBrandsByName(this.brandForm.name || '', this.brands, {
      limit: 15,
      excludeId: this.isCreatingBrand ? undefined : (this.editingBrandId ?? undefined)
    });
  }

  onBrandNameSuggestionPicked(event: MatAutocompleteSelectedEvent): void {
    this.brandForm.name = String(event.option.value);
  }

  async saveBrand(): Promise<void> {
    let name = this.brandForm.name?.trim();
    if (!name) {
      Swal.fire({ icon: 'warning', title: 'Nombre requerido' });
      return;
    }
    name = name.toLocaleUpperCase('es-MX');

    if (this.isCreatingBrand) {
      const duplicate = findExactBrandMatch(name, this.brands);
      if (duplicate) {
        await Swal.fire({
          icon: 'info',
          title: 'Ya existe en el catálogo',
          text: 'Hay una marca con el mismo nombre. Elige la existente o cambia el texto.',
          confirmButtonText: 'Entendido'
        });
        return;
      }
      const similar = findFuzzySimilarBrand(name, this.brands);
      if (similar) {
        const r = await Swal.fire({
          icon: 'question',
          title: '¿Era esta marca?',
          html: `«<strong>${name}</strong>» se parece a <strong>${similar.name}</strong>. ¿Usar el nombre del catálogo?`,
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: `Usar «${similar.name}»`,
          denyButtonText: 'Crear con el texto escrito',
          cancelButtonText: 'Volver a editar'
        });
        if (r.isConfirmed) {
          name = this.formatBrandName(similar.name);
          this.brandForm.name = name;
        } else if (!r.isDenied) {
          return;
        }
      }
    } else if (this.editingBrandId) {
      const other = findExactBrandMatch(name, this.brands, this.editingBrandId);
      if (other) {
        await Swal.fire({
          icon: 'info',
          title: 'Nombre en uso',
          text: 'Otra marca ya usa ese nombre.',
          confirmButtonText: 'Entendido'
        });
        return;
      }
    }

    const payload = {
      name,
      image_path: this.brandForm.image_path?.trim() || null
    };
    if (this.isCreatingBrand) {
      this.adminService.createInventoryBrand(payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Marca creada' });
          this.cancelBrandForm();
          this.loadAll();
        },
        error: (err) => this.showError(err, 'crear la marca')
      });
    } else if (this.editingBrandId) {
      this.adminService.updateInventoryBrand(this.editingBrandId, payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Marca actualizada' });
          this.cancelBrandForm();
          this.loadAll();
        },
        error: (err) => this.showError(err, 'actualizar la marca')
      });
    }
  }

  deleteBrand(b: AdminInventoryBrand): void {
    Swal.fire({
      title: '¿Eliminar marca?',
      text: `Se eliminará «${this.formatBrandName(b.name)}» (lógico). Si hay vehículos o líneas vinculadas, puede fallar por integridad.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteInventoryBrand(b.id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Marca eliminada' });
            this.loadAll();
          },
          error: (err: { error?: GralResponse }) =>
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err?.error?.message || 'Error al eliminar.'
            })
        });
      }
    });
  }

  // --- Líneas de marca (brand_lines) — nombres de series / grupos bajo una marca ---

  isCreatingLine = false;
  editingLineId: number | null = null;
  lineForm: { name: string; brand_id: string; image_path: string } = {
    name: '',
    brand_id: '',
    image_path: ''
  };

  startCreateLine(): void {
    this.isCreatingLine = true;
    this.editingLineId = null;
    const first = this.brands[0];
    this.lineForm = {
      name: '',
      brand_id: first ? String(first.id) : '',
      image_path: ''
    };
    this.scrollToForm('bm-form-line');
  }

  startEditLine(l: AdminBrandLineRow): void {
    const id = this.parseRowId(l.id, 'línea de marca');
    if (id == null) {
      void Swal.fire({
        icon: 'error',
        title: 'No se puede editar',
        text: 'No hay un identificador válido para esta línea. Recarga la página.'
      });
      return;
    }
    this.isCreatingLine = false;
    this.editingLineId = id;
    this.lineForm = {
      name: l.name ?? '',
      brand_id: l.brand_id != null ? String(l.brand_id) : '',
      image_path: l.image_path ?? ''
    };
    this.scrollToForm('bm-form-line');
  }

  cancelLineForm(): void {
    this.isCreatingLine = false;
    this.editingLineId = null;
    this.lineForm = { name: '', brand_id: '', image_path: '' };
  }

  saveLine(): void {
    const name = this.lineForm.name?.trim();
    const brandId = this.lineForm.brand_id ? Number(this.lineForm.brand_id) : NaN;
    if (!name) {
      Swal.fire({ icon: 'warning', title: 'Nombre requerido' });
      return;
    }
    if (!Number.isFinite(brandId) || brandId < 1) {
      Swal.fire({ icon: 'warning', title: 'Marca requerida' });
      return;
    }
    const payload = {
      name,
      brand_id: brandId,
      image_path: this.lineForm.image_path?.trim() || null
    };
    if (this.isCreatingLine) {
      this.adminService.createBrandLine(payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Línea creada' });
          this.cancelLineForm();
          this.loadAll();
        },
        error: (err) => this.showError(err, 'crear la línea')
      });
    } else if (this.editingLineId) {
      this.adminService.updateBrandLine(this.editingLineId, payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Línea actualizada' });
          this.cancelLineForm();
          this.loadAll();
        },
        error: (err) => this.showError(err, 'actualizar la línea')
      });
    }
  }

  deleteLine(l: AdminBrandLineRow): void {
    Swal.fire({
      title: '¿Eliminar línea de marca?',
      text: `Se eliminará «${l.name}». Los modelos asociados pueden quedar afectados.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteBrandLine(l.id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Línea eliminada' });
            this.loadAll();
          },
          error: (err: { error?: GralResponse }) =>
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err?.error?.message || 'Error al eliminar.'
            })
        });
      }
    });
  }

  // --- Modelos (line_models) ---

  linesForSelectedModelBrand(): AdminBrandLineRow[] {
    const id = this.modelForm.filterBrandId
      ? Number(this.modelForm.filterBrandId)
      : NaN;
    if (!Number.isFinite(id)) {
      return [];
    }
    return this.brandLines.filter((l) => l.brand_id === id);
  }

  startCreateModel(): void {
    this.isCreatingModel = true;
    this.editingModelId = null;
    const firstBrand = this.brands[0];
    this.modelForm = {
      name: '',
      year: new Date().getFullYear().toString(),
      line_id: '',
      image_path: '',
      filterBrandId: firstBrand ? String(firstBrand.id) : ''
    };
    this.scrollToForm('bm-form-model');
  }

  startEditModel(m: AdminLineModelRow): void {
    const id = this.parseRowId(m.id, 'modelo de línea');
    if (id == null) {
      void Swal.fire({
        icon: 'error',
        title: 'No se puede editar',
        text: 'No hay un identificador válido para este modelo. Recarga la página.'
      });
      return;
    }
    this.isCreatingModel = false;
    this.editingModelId = id;
    const brandId = m.brand_id ?? this.lineById(m.line_id)?.brand_id;
    this.modelForm = {
      name: m.name ?? '',
      year: String(m.year),
      line_id: m.line_id != null ? String(m.line_id) : '',
      image_path: m.image_path ?? '',
      filterBrandId: brandId != null ? String(brandId) : ''
    };
    this.scrollToForm('bm-form-model');
  }

  cancelModelForm(): void {
    this.isCreatingModel = false;
    this.editingModelId = null;
    this.modelForm = {
      name: '',
      year: '',
      line_id: '',
      image_path: '',
      filterBrandId: ''
    };
  }

  onModelBrandChange(): void {
    this.modelForm.line_id = '';
  }

  saveModel(): void {
    const name = this.modelForm.name?.trim();
    const year = this.modelForm.year?.trim();
    const lineId = this.modelForm.line_id ? Number(this.modelForm.line_id) : NaN;
    if (!name || !year) {
      Swal.fire({ icon: 'warning', title: 'Completa nombre y año' });
      return;
    }
    if (!Number.isFinite(lineId) || lineId < 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Línea requerida',
        text: 'Selecciona la marca y la línea (grupo) del vehículo.'
      });
      return;
    }
    const payload = {
      name,
      year,
      line_id: lineId,
      image_path: this.modelForm.image_path?.trim() || null
    };
    if (this.isCreatingModel) {
      this.adminService.createLineModel(payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Modelo creado' });
          this.cancelModelForm();
          this.loadAll();
        },
        error: (err) => this.showError(err, 'crear el modelo')
      });
    } else if (this.editingModelId) {
      this.adminService.updateLineModel(this.editingModelId, payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Modelo actualizado' });
          this.cancelModelForm();
          this.loadAll();
        },
        error: (err) => this.showError(err, 'actualizar el modelo')
      });
    }
  }

  deleteModel(m: AdminLineModelRow): void {
    Swal.fire({
      title: '¿Eliminar modelo?',
      text: `Se eliminará «${this.displayName(m.name)}»`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteLineModel(m.id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Modelo eliminado' });
            this.loadAll();
          },
          error: (err) =>
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: (err as { error?: GralResponse })?.error?.message || 'Error al eliminar.'
            })
        });
      }
    });
  }

  /**
   * Marca en mayúsculas (coherente con inventario y con cómo se persiste en
   * `vehicle_brands` vía mutator en el backend).
   */
  formatBrandName(raw: string | null | undefined): string {
    if (raw == null || raw === '') {
      return '';
    }
    return String(raw).toLocaleUpperCase('es-MX');
  }

  brandName(brandId: number | null | undefined): string {
    if (brandId == null) {
      return '—';
    }
    const b = this.brands.find((x) => x.id === brandId);
    return b ? this.formatBrandName(b.name) : '—';
  }

  lineById(lineId: number | null | undefined): AdminBrandLineRow | undefined {
    if (lineId == null) {
      return undefined;
    }
    return this.brandLines.find((l) => l.id === lineId);
  }

  lineName(lineId: number | null | undefined): string {
    const line = this.lineById(lineId);
    return line ? this.displayName(line.name) : '—';
  }

  displayName(raw: string): string {
    if (!raw) {
      return '';
    }
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }

  setModelFilter(brandId: string | number): void {
    const s = brandId === null || brandId === undefined ? '' : String(brandId);
    this.modelFilterSelect = s;
    this.modelListPageIndex = 0;
    if (s === '') {
      this.modelFilterBrandId = null;
      return;
    }
    const n = Number(s);
    this.modelFilterBrandId = Number.isFinite(n) ? n : null;
  }

  private showError(err: unknown, action: string): void {
    const e = err as { error?: { message?: string; errors?: Record<string, string[]> } };
    const msg = e?.error?.message;
    const ve = e?.error?.errors;
    const text =
      msg || (ve ? Object.values(ve).flat().join(' ') : `Error al ${action}.`);
    Swal.fire({ icon: 'error', title: 'Error', text });
  }
}
