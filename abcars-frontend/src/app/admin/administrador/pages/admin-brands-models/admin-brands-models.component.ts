import { Component, OnInit } from '@angular/core';
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

  // --- Marcas ---

  startCreateBrand(): void {
    this.isCreatingBrand = true;
    this.editingBrandId = null;
    this.brandForm = { name: '', image_path: '' };
  }

  startEditBrand(b: AdminInventoryBrand): void {
    this.isCreatingBrand = false;
    this.editingBrandId = b.id;
    this.brandForm = {
      name: b.name ?? '',
      image_path: b.image_path ?? ''
    };
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
          name = similar.name;
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
      text: `Se eliminará «${this.displayName(b.name)}» (lógico). Si hay vehículos o líneas vinculadas, puede fallar por integridad.`,
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
  }

  startEditLine(l: AdminBrandLineRow): void {
    this.isCreatingLine = false;
    this.editingLineId = l.id;
    this.lineForm = {
      name: l.name ?? '',
      brand_id: l.brand_id != null ? String(l.brand_id) : '',
      image_path: l.image_path ?? ''
    };
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
  }

  startEditModel(m: AdminLineModelRow): void {
    this.isCreatingModel = false;
    this.editingModelId = m.id;
    const brandId = m.brand_id ?? this.lineById(m.line_id)?.brand_id;
    this.modelForm = {
      name: m.name ?? '',
      year: String(m.year),
      line_id: m.line_id != null ? String(m.line_id) : '',
      image_path: m.image_path ?? '',
      filterBrandId: brandId != null ? String(brandId) : ''
    };
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

  brandName(brandId: number | null | undefined): string {
    if (brandId == null) {
      return '—';
    }
    const b = this.brands.find((x) => x.id === brandId);
    return b ? this.displayName(b.name) : '—';
  }

  /** Nombre de marca tal como se guarda (sin capitalizar) para listados. */
  brandNameStored(brandId: number | null | undefined): string {
    if (brandId == null) {
      return '—';
    }
    const b = this.brands.find((x) => x.id === brandId);
    return b?.name ? String(b.name) : '—';
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
