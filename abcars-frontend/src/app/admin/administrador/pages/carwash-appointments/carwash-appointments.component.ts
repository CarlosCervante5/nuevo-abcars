import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  CarWashLocation,
  CarWashService,
  CarWashServiceType
} from '@services/carwash.service';

@Component({
  selector: 'app-carwash-appointments',
  standalone: true,
  templateUrl: './carwash-appointments.component.html',
  styleUrls: ['./carwash-appointments.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class CarWashAppointmentsComponent implements OnInit {
  locations: CarWashLocation[] = [];
  services: CarWashServiceType[] = [];
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;

  form = {
    order_type: 'public' as 'public' | 'internal_sales_delivery',
    location_uuid: '',
    service_type_uuid: '',
    customer_name: '',
    customer_phone: '',
    vehicle_plates: '',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_color: '',
    vehicle_vin: '',
    vehicle_condition: '' as '' | 'new' | 'used',
    requested_by_name: '',
    scheduled_start_at: '',
    notes: ''
  };

  constructor(private carwash: CarWashService) {}

  ngOnInit(): void {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    this.form.scheduled_start_at = now.toISOString().slice(0, 16);

    this.carwash.listLocations().subscribe({
      next: (res) => {
        this.locations = res.data || [];
        if (this.locations.length && !this.form.location_uuid) {
          this.form.location_uuid = this.locations[0].uuid;
        }
      }
    });
    this.carwash.listServiceTypes().subscribe({
      next: (res) => {
        this.services = res.data || [];
        if (this.services.length && !this.form.service_type_uuid) {
          this.form.service_type_uuid = this.services[0].uuid;
        }
      }
    });
  }

  get isInternal(): boolean {
    return this.form.order_type === 'internal_sales_delivery';
  }

  onOrderTypeChange(): void {
    if (this.isInternal && !this.form.customer_name) {
      this.form.customer_name = 'Entrega Ventas';
    }
  }

  submit(): void {
    this.saving = true;
    this.error = null;
    this.success = null;

    if (this.isInternal) {
      if (!this.form.vehicle_vin || this.form.vehicle_vin.replace(/\s+/g, '').length < 11) {
        this.saving = false;
        this.error = 'VIN obligatorio para entrega Ventas (mín. 11 caracteres)';
        return;
      }
      if (!this.form.vehicle_condition) {
        this.saving = false;
        this.error = 'Indica si el auto es nuevo o seminuevo';
        return;
      }
      if (!this.form.vehicle_brand || !this.form.vehicle_model) {
        this.saving = false;
        this.error = 'Marca y modelo son obligatorios en entregas Ventas';
        return;
      }
    }

    const payload: Record<string, unknown> = {
      ...this.form,
      vehicle_condition: this.form.vehicle_condition || null,
      vehicle_vin: this.form.vehicle_vin || null,
      scheduled_start_at: new Date(this.form.scheduled_start_at).toISOString(),
      channel: 'admin'
    };

    this.carwash.createAppointment(payload).subscribe({
      next: () => {
        this.saving = false;
        this.success = this.isInternal
          ? 'Entrega Ventas agendada. VIN pendiente de validar en el tablero.'
          : 'Cita pública creada correctamente';
        this.form.customer_name = this.isInternal ? 'Entrega Ventas' : '';
        this.form.customer_phone = '';
        this.form.vehicle_plates = '';
        this.form.vehicle_vin = '';
        this.form.vehicle_brand = '';
        this.form.vehicle_model = '';
        this.form.vehicle_color = '';
        this.form.vehicle_condition = '';
        this.form.requested_by_name = '';
        this.form.notes = '';
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'No se pudo crear la cita';
      }
    });
  }
}
