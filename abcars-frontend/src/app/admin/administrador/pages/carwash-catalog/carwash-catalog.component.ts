import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  CarWashProduct,
  CarWashService,
  CarWashServiceType
} from '@services/carwash.service';

@Component({
  selector: 'app-carwash-catalog',
  standalone: true,
  templateUrl: './carwash-catalog.component.html',
  styleUrls: ['./carwash-catalog.component.css'],
  imports: [CommonModule, MatProgressSpinnerModule]
})
export class CarWashCatalogComponent implements OnInit {
  services: CarWashServiceType[] = [];
  products: CarWashProduct[] = [];
  loading = false;
  error: string | null = null;

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

    this.carwash.listServiceTypes().subscribe({
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
}
