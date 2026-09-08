import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  CarWashAppointment,
  CarWashLocation,
  CarWashOrder,
  CarWashProduct,
  CarWashService,
  CarWashServiceType
} from '@services/carwash.service';

interface CartLine {
  item_type: 'service' | 'product';
  uuid: string;
  name: string;
  unit_price: number;
  quantity: number;
}

@Component({
  selector: 'app-carwash-pos',
  standalone: true,
  templateUrl: './carwash-pos.component.html',
  styleUrls: ['./carwash-pos.component.css'],
  imports: [CommonModule, FormsModule, RouterModule, MatProgressSpinnerModule]
})
export class CarWashPosComponent implements OnInit {
  locations: CarWashLocation[] = [];
  services: CarWashServiceType[] = [];
  products: CarWashProduct[] = [];
  todaysAppointments: CarWashAppointment[] = [];

  locationUuid = '';
  appointmentUuid = '';
  customerName = '';
  customerPhone = '';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mixed' = 'cash';
  notes = '';
  catalogQuery = '';
  catalogTab: 'services' | 'products' = 'services';

  cart: CartLine[] = [];
  loading = false;
  checkingOut = false;
  error: string | null = null;
  lastOrder: CarWashOrder | null = null;

  readonly paymentOptions: { value: 'cash' | 'card' | 'transfer' | 'mixed'; label: string }[] = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'mixed', label: 'Mixto' }
  ];

  constructor(private carwash: CarWashService) {}

  ngOnInit(): void {
    this.loading = true;
    this.carwash.listLocations().subscribe({
      next: (res) => {
        this.locations = res.data || [];
        if (this.locations.length) {
          this.locationUuid = this.locations[0].uuid;
          this.reloadDayAppointments();
        }
      }
    });
    this.carwash.listServiceTypes().subscribe({
      next: (res) => (this.services = res.data || [])
    });
    this.carwash.listProducts().subscribe({
      next: (res) => {
        this.products = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo cargar el catálogo POS';
      }
    });
  }

  get filteredServices(): CarWashServiceType[] {
    const q = this.catalogQuery.trim().toLowerCase();
    if (!q) return this.services;
    return this.services.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.code || '').toLowerCase().includes(q)
    );
  }

  get filteredProducts(): CarWashProduct[] {
    const q = this.catalogQuery.trim().toLowerCase();
    if (!q) return this.products;
    return this.products.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
    );
  }

  get cartCount(): number {
    return this.cart.reduce((sum, l) => sum + l.quantity, 0);
  }

  get subtotal(): number {
    return this.cart.reduce((sum, l) => sum + l.unit_price * l.quantity, 0);
  }

  onLocationChange(): void {
    this.appointmentUuid = '';
    this.reloadDayAppointments();
  }

  reloadDayAppointments(): void {
    if (!this.locationUuid) return;
    const today = this.localDateKey(new Date());
    this.carwash.listAppointments({ date: today, location_uuid: this.locationUuid, per_page: 50 }).subscribe({
      next: (res) => {
        const data = res.data as { data?: CarWashAppointment[] } | CarWashAppointment[];
        this.todaysAppointments = Array.isArray(data) ? data : data?.data || [];
      }
    });
  }

  onAppointmentPick(): void {
    const appt = this.todaysAppointments.find((a) => a.uuid === this.appointmentUuid);
    if (!appt) return;
    this.customerName = appt.customer_name || '';
    this.customerPhone = appt.customer_phone || '';
    if (appt.service_type?.uuid) {
      this.addService(appt.service_type);
    }
  }

  addService(service: CarWashServiceType): void {
    this.addLine({
      item_type: 'service',
      uuid: service.uuid,
      name: service.name,
      unit_price: Number(service.price) || 0,
      quantity: 1
    });
  }

  addProduct(product: CarWashProduct): void {
    if ((product.stock || 0) < 1) return;
    this.addLine({
      item_type: 'product',
      uuid: product.uuid,
      name: product.name,
      unit_price: Number(product.price) || 0,
      quantity: 1
    });
  }

  private addLine(line: CartLine): void {
    const existing = this.cart.find((c) => c.item_type === line.item_type && c.uuid === line.uuid);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart = [...this.cart, { ...line }];
    }
  }

  bumpQty(line: CartLine, delta: number): void {
    const next = line.quantity + delta;
    if (next < 1) {
      this.removeLine(line);
      return;
    }
    line.quantity = next;
  }

  removeLine(line: CartLine): void {
    this.cart = this.cart.filter((c) => !(c.item_type === line.item_type && c.uuid === line.uuid));
  }

  clearTicket(): void {
    this.cart = [];
    this.appointmentUuid = '';
    this.customerName = '';
    this.customerPhone = '';
    this.notes = '';
    this.paymentMethod = 'cash';
    this.error = null;
  }

  paymentLabel(method: string | null | undefined): string {
    const found = this.paymentOptions.find((o) => o.value === method);
    return found?.label || method || '—';
  }

  checkout(): void {
    if (!this.locationUuid || !this.cart.length) {
      this.error = 'Selecciona sede e ítems';
      return;
    }
    this.checkingOut = true;
    this.error = null;
    this.lastOrder = null;
    this.carwash
      .checkout({
        location_uuid: this.locationUuid,
        appointment_uuid: this.appointmentUuid || undefined,
        customer_name: this.customerName || undefined,
        customer_phone: this.customerPhone || undefined,
        payment_method: this.paymentMethod,
        notes: this.notes || undefined,
        items: this.cart.map((c) => ({
          item_type: c.item_type,
          uuid: c.uuid,
          quantity: c.quantity
        }))
      })
      .subscribe({
        next: (res) => {
          this.checkingOut = false;
          this.lastOrder = res.data;
          this.clearTicket();
          this.carwash.listProducts().subscribe({ next: (p) => (this.products = p.data || []) });
        },
        error: (err) => {
          this.checkingOut = false;
          this.error = err?.error?.message || 'No se pudo cobrar';
        }
      });
  }

  private localDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
