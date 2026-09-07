import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  AdminAnalyticsDashboardService,
  PublishLogItem
} from '@services/admin-analytics-dashboard.service';

@Component({
  selector: 'app-inventory-publish-log',
  templateUrl: './inventory-publish-log.component.html',
  styleUrls: ['./inventory-publish-log.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class InventoryPublishLogComponent implements OnInit {
  selectedPeriod = 30;
  toStatus: string | null = null;
  vehicleUuid = '';
  limit = 100;

  loading = false;
  error: string | null = null;
  items: PublishLogItem[] = [];

  periodOptions = [
    { value: 7, label: 'Últimos 7 días' },
    { value: 30, label: 'Últimos 30 días' },
    { value: 60, label: 'Últimos 60 días' },
    { value: 90, label: 'Últimos 90 días' }
  ];

  statusOptions = [
    { value: null, label: 'Todos los cambios' },
    { value: 'active', label: 'Solo publicaciones (→ Activo)' },
    { value: 'inactive', label: 'Solo bajas (→ Inactivo)' },
    { value: 'sale', label: 'Solo vendidos (→ Vendido)' }
  ];

  private readonly sourceLabels: Record<string, string> = {
    manual_status: 'Cambio manual de estatus',
    status_batch: 'Cambio masivo de estatus',
    vehicle_create_update: 'Alta o edición de vehículo',
    upload_last_image: 'Publicación por subida de fotos',
    images_empty_auto_inactive: 'Baja automática (sin fotos)',
    images_batch_deleted: 'Baja por eliminación de fotos',
    intelimotor_sync: 'Sincronización Intelimotor',
    intelimotor_images_sync: 'Fotos sincronizadas (Intelimotor)',
    intelimotor_marked_sold: 'Marcado vendido (Intelimotor)'
  };

  private readonly statusLabels: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    sale: 'Vendido',
    valuing: 'En valuación'
  };

  constructor(private analyticsService: AdminAnalyticsDashboardService) {}

  ngOnInit(): void {
    this.loadData();
  }

  onFilterChange(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - this.selectedPeriod);

    this.analyticsService.getPublishLog({
      start_date: this.toDateString(start),
      end_date: this.toDateString(end),
      vehicle_uuid: this.vehicleUuid.trim() || null,
      to_status: this.toStatus,
      limit: this.limit
    }).subscribe({
      next: (res) => {
        this.items = res.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el historial de publicaciones.';
        this.items = [];
        this.loading = false;
      }
    });
  }

  sourceLabel(source: string): string {
    return this.sourceLabels[source] ?? source;
  }

  statusLabel(status: string | null): string {
    if (!status) {
      return '—';
    }
    return this.statusLabels[status] ?? status;
  }

  statusBadgeClass(status: string | null): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      case 'sale':
        return 'bg-blue-100 text-blue-800';
      case 'valuing':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private toDateString(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
