import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  CarWashAppointment,
  CarWashLocation,
  CarWashService
} from '@services/carwash.service';

@Component({
  selector: 'app-carwash-board',
  standalone: true,
  templateUrl: './carwash-board.component.html',
  styleUrls: ['./carwash-board.component.css'],
  imports: [CommonModule, FormsModule, RouterModule, MatProgressSpinnerModule]
})
export class CarWashBoardComponent implements OnInit {
  date = new Date().toISOString().slice(0, 10);
  locationUuid = '';
  locations: CarWashLocation[] = [];
  columns: { key: string; label: string; items: CarWashAppointment[] }[] = [];
  loading = false;
  error: string | null = null;
  total = 0;

  readonly statusLabels: Record<string, string> = {
    scheduled: 'Agendadas',
    checked_in: 'Recepcionadas',
    in_progress: 'En lavado',
    ready: 'Listas',
    delivered: 'Entregadas',
    draft: 'Borrador',
    cancelled: 'Canceladas',
    no_show: 'No show'
  };

  readonly nextStatus: Record<string, string | null> = {
    scheduled: 'checked_in',
    checked_in: 'in_progress',
    in_progress: 'ready',
    ready: 'delivered',
    delivered: null,
    draft: 'scheduled',
    cancelled: null,
    no_show: null
  };

  constructor(private carwash: CarWashService) {}

  ngOnInit(): void {
    this.carwash.listLocations().subscribe({
      next: (res) => {
        this.locations = res.data || [];
      }
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.carwash.getBoard(this.date, this.locationUuid || undefined).subscribe({
      next: (res) => {
        const byStatus = res.data?.by_status || {};
        this.total = res.data?.total || 0;
        this.columns = ['scheduled', 'checked_in', 'in_progress', 'ready', 'delivered'].map((key) => ({
          key,
          label: this.statusLabels[key] || key,
          items: byStatus[key] || []
        }));
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'No se pudo cargar el tablero CarWash';
      }
    });
  }

  advance(item: CarWashAppointment): void {
    const next = this.nextStatus[item.status];
    if (!next) return;
    this.carwash.updateStatus(item.uuid, next).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo actualizar el estatus';
      }
    });
  }
}
