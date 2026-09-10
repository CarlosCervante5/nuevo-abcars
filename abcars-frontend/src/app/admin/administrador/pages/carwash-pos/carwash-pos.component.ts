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
  orderType: 'public' | 'internal_sales_delivery' = 'public';
  customerName = '';
  customerPhone = '';
  vehicleVin = '';
  vehicleCondition: '' | 'new' | 'used' = '';
  vehiclePlates = '';
  vehicleBrand = '';
  vehicleModel = '';
  vehicleColor = '';
  requestedByName = '';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mixed' | 'internal' = 'cash';
  notes = '';
  catalogQuery = '';
  catalogTab: 'services' | 'products' | 'food' = 'services';

  cart: CartLine[] = [];
  loading = false;
  checkingOut = false;
  error: string | null = null;
  lastOrder: CarWashOrder | null = null;

  readonly paymentOptions: { value: 'cash' | 'card' | 'transfer' | 'mixed' | 'internal'; label: string }[] = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'mixed', label: 'Mixto' },
    { value: 'internal', label: 'Interno (Ventas)' }
  ];

  get isInternal(): boolean {
    return this.orderType === 'internal_sales_delivery';
  }

  get displaySubtotal(): number {
    return this.isInternal ? 0 : this.subtotal;
  }

  onOrderTypeChange(): void {
    if (this.isInternal) {
      this.paymentMethod = 'internal';
      if (!this.customerName) this.customerName = 'Entrega Ventas';
    } else if (this.paymentMethod === 'internal') {
      this.paymentMethod = 'cash';
    }
  }

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
    return this.filterProductsByCategory('amenity');
  }

  get filteredFood(): CarWashProduct[] {
    return this.filterProductsByCategory('food');
  }

  private filterProductsByCategory(category: 'amenity' | 'food'): CarWashProduct[] {
    const q = this.catalogQuery.trim().toLowerCase();
    return this.products.filter((p) => {
      if (!this.isProductCategory(p, category)) return false;
      if (!q) return true;
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
      );
    });
  }

  private isProductCategory(p: CarWashProduct, category: 'amenity' | 'food'): boolean {
    const raw = (p.category || '').toLowerCase();
    if (raw === 'food' || raw === 'alimento' || raw === 'alimentos') {
      return category === 'food';
    }
    if (raw === 'amenity' || raw === 'amenidad' || raw === 'amenidades') {
      return category === 'amenity';
    }
    // Fallback por SKU (antes de migración / productos viejos)
    const sku = (p.sku || '').toUpperCase();
    const isFood = sku.startsWith('AL-') || sku.startsWith('CF-');
    return category === 'food' ? isFood : !isFood;
  }

  productLabel(p: CarWashProduct): string {
    return this.isProductCategory(p, 'food') ? 'Alimento' : 'Amenidad';
  }

  lineLabel(line: CartLine): string {
    if (line.item_type === 'service') return 'Servicio';
    const product = this.products.find((p) => p.uuid === line.uuid);
    return product ? this.productLabel(product) : 'Producto';
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
    this.customerName = this.isInternal ? 'Entrega Ventas' : '';
    this.customerPhone = '';
    this.vehicleVin = '';
    this.vehicleCondition = '';
    this.vehiclePlates = '';
    this.vehicleBrand = '';
    this.vehicleModel = '';
    this.vehicleColor = '';
    this.requestedByName = '';
    this.notes = '';
    this.paymentMethod = this.isInternal ? 'internal' : 'cash';
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
    if (this.isInternal) {
      const vin = (this.vehicleVin || '').replace(/\s+/g, '');
      if (vin.length < 11) {
        this.error = 'VIN obligatorio para entrega Ventas';
        return;
      }
      if (!this.vehicleCondition) {
        this.error = 'Indica nuevo o seminuevo';
        return;
      }
      if (!this.vehicleBrand || !this.vehicleModel) {
        this.error = 'Marca y modelo obligatorios';
        return;
      }
      if (!this.cart.some((c) => c.item_type === 'service')) {
        this.error = 'Agrega un servicio de lavado';
        return;
      }
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
        order_type: this.orderType,
        vehicle_vin: this.isInternal ? this.vehicleVin : undefined,
        vehicle_condition: this.isInternal && this.vehicleCondition ? this.vehicleCondition : undefined,
        vehicle_plates: this.vehiclePlates || undefined,
        vehicle_brand: this.vehicleBrand || undefined,
        vehicle_model: this.vehicleModel || undefined,
        vehicle_color: this.vehicleColor || undefined,
        requested_by_name: this.requestedByName || undefined,
        payment_method: this.isInternal ? 'internal' : this.paymentMethod,
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
