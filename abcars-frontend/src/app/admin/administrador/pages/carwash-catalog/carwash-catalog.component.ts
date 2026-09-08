import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  CarWashProduct,
  CarWashService,
  CarWashServiceType
} from '@services/carwash.service';

interface ServiceForm {
  name: string;
  code: string;
  description: string;
  duration_minutes: number;
  price: number;
  sort_order: number;
  is_active: boolean;
}

@Component({
  selector: 'app-carwash-catalog',
  standalone: true,
  templateUrl: './carwash-catalog.component.html',
  styleUrls: ['./carwash-catalog.component.css'],
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule]
})
export class CarWashCatalogComponent implements OnInit {
  services: CarWashServiceType[] = [];
  products: CarWashProduct[] = [];
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;

  editingUuid: string | null = null;
  creating = false;
  form: ServiceForm = this.emptyForm();

  constructor(private carwash: CarWashService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    let pending = 2;
    const done = () => {
      pending -= 1;
      if (pending <= 0) this.loading = false;
    };

    this.carwash.listServiceTypes(true).subscribe({
      next: (res) => {
        this.services = res.data || [];
        done();
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar los servicios';
        done();
      }
    });

    this.carwash.listProducts().subscribe({
      next: (res) => {
        this.products = res.data || [];
        done();
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar los productos';
        done();
      }
    });
  }

  startCreate(): void {
    this.creating = true;
    this.editingUuid = null;
    this.form = this.emptyForm();
    this.form.sort_order = (this.services.length + 1) * 10;
    this.success = null;
    this.error = null;
  }

  startEdit(service: CarWashServiceType): void {
    this.creating = false;
    this.editingUuid = service.uuid;
    this.form = {
      name: service.name,
      code: service.code,
      description: service.description || '',
      duration_minutes: Number(service.duration_minutes) || 60,
      price: Number(service.price) || 0,
      sort_order: Number(service.sort_order) || 0,
      is_active: !!service.is_active
    };
    this.success = null;
    this.error = null;
  }

  cancelEdit(): void {
    this.creating = false;
    this.editingUuid = null;
    this.form = this.emptyForm();
  }

  save(): void {
    if (!this.form.name.trim() || !this.form.code.trim()) {
      this.error = 'Nombre y código son obligatorios';
      return;
    }
    if (this.form.duration_minutes < 5 || this.form.price < 0) {
      this.error = 'Revisa duración (mín. 5) y precio';
      return;
    }

    this.saving = true;
    this.error = null;
    this.success = null;

    const payload = {
      name: this.form.name.trim(),
      code: this.slugCode(this.form.code),
      description: this.form.description.trim() || null,
      duration_minutes: Number(this.form.duration_minutes),
      price: Number(this.form.price),
      sort_order: Number(this.form.sort_order) || 0,
      is_active: !!this.form.is_active
    };

    const req = this.creating
      ? this.carwash.createServiceType(payload)
      : this.carwash.updateServiceType(this.editingUuid!, payload);

    req.subscribe({
      next: () => {
        this.saving = false;
        this.success = this.creating ? 'Servicio creado' : 'Servicio actualizado';
        this.cancelEdit();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'No se pudo guardar el servicio';
      }
    });
  }

  toggleActive(service: CarWashServiceType): void {
    this.carwash.updateServiceType(service.uuid, { is_active: !service.is_active }).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo cambiar el estatus';
      }
    });
  }

  remove(service: CarWashServiceType): void {
    if (!confirm(`¿Eliminar el servicio "${service.name}"?`)) return;
    this.carwash.deleteServiceType(service.uuid).subscribe({
      next: () => {
        this.success = 'Servicio eliminado';
        if (this.editingUuid === service.uuid) this.cancelEdit();
        this.load();
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo eliminar';
      }
    });
  }

  onNameChange(): void {
    if (this.creating) {
      this.form.code = this.slugCode(this.form.name);
    }
  }

  productGroup(p: CarWashProduct): string {
    const sku = (p.sku || '').toUpperCase();
    if (sku.startsWith('LQ-')) return 'Líquidos';
    if (sku.startsWith('CX-')) return 'Ceras';
    if (sku.startsWith('TR-')) return 'Trapos y textiles';
    return 'Amenidades';
  }

  get productGroups(): { label: string; items: CarWashProduct[] }[] {
    const order = ['Líquidos', 'Ceras', 'Trapos y textiles', 'Amenidades'];
    const map = new Map<string, CarWashProduct[]>();
    for (const p of this.products) {
      const g = this.productGroup(p);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(p);
    }
    return order
      .filter((label) => map.has(label))
      .map((label) => ({ label, items: map.get(label)! }));
  }

  private emptyForm(): ServiceForm {
    return {
      name: '',
      code: '',
      description: '',
      duration_minutes: 60,
      price: 0,
      sort_order: 0,
      is_active: true
    };
  }

  private slugCode(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  }
}
