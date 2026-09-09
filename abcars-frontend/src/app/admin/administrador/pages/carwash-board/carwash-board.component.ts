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

interface BoardDayTab {
  date: string;
  label: string;
  count: number;
}

type BoardView = 'kanban' | 'orders';

@Component({
  selector: 'app-carwash-board',
  standalone: true,
  templateUrl: './carwash-board.component.html',
  styleUrls: ['./carwash-board.component.css'],
  imports: [CommonModule, FormsModule, RouterModule, MatProgressSpinnerModule]
})
export class CarWashBoardComponent implements OnInit {
  view: BoardView = 'kanban';
  date = '';
  locationUuid = '';
  statusFilter = '';
  locations: CarWashLocation[] = [];
  columns: { key: string; label: string; items: CarWashAppointment[] }[] = [];
  orders: CarWashAppointment[] = [];
  dayTabs: BoardDayTab[] = [];
  loading = false;
  error: string | null = null;
  total = 0;
  updatingUuid: string | null = null;

  readonly statusLabels: Record<string, string> = {
    scheduled: 'Agendada',
    checked_in: 'Recepcionada',
    in_progress: 'En lavado',
    ready: 'Lista',
    delivered: 'Entregada',
    draft: 'Borrador',
    cancelled: 'Cancelada',
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

  readonly statusOptions = [
    'scheduled',
    'checked_in',
    'in_progress',
    'ready',
    'delivered',
    'cancelled',
    'no_show',
    'draft'
  ];

  private readonly pipelineStatuses = new Set(['scheduled', 'checked_in', 'in_progress', 'ready', 'draft']);

  constructor(private carwash: CarWashService) {}

  ngOnInit(): void {
    this.date = this.localDateKey(new Date());
    this.carwash.listLocations().subscribe({
      next: (res) => {
        this.locations = res.data || [];
      }
    });
    this.refreshDayTabs(true);
  }

  setView(view: BoardView): void {
    if (this.view === view) return;
    this.view = view;
    this.load();
  }

  goToday(): void {
    this.date = this.localDateKey(new Date());
    this.load();
  }

  goTomorrow(): void {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    this.date = this.localDateKey(d);
    this.load();
  }

  clearDate(): void {
    this.date = '';
    this.load();
  }

  selectDay(date: string): void {
    this.date = date;
    this.load();
  }

  onFiltersChange(): void {
    this.refreshDayTabs(false);
    this.load();
  }

  private localDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');

    return `${y}-${m}-${day}`;
  }

  private mexicoDateKey(iso: string): string | null {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  }

  private isPipeline(item: CarWashAppointment): boolean {
    return this.pipelineStatuses.has(item.status);
  }

  /** Días con citas pendientes (14 días) + auto-salta al más cercano si hoy no tiene pendientes. */
  refreshDayTabs(autoJump: boolean): void {
    const from = this.localDateKey(new Date());
    const end = new Date();
    end.setDate(end.getDate() + 14);
    const to = this.localDateKey(end);

    this.carwash.getCalendar(from, to, this.locationUuid || undefined).subscribe({
      next: (res) => {
        const byDate = res.data?.by_date || {};
        const items = res.data?.items || [];
        const counts = new Map<string, number>();

        for (const item of items) {
          if (!this.isPipeline(item)) continue;
          const key = this.mexicoDateKey(item.scheduled_start_at || '') || '';
          if (!key) continue;
          counts.set(key, (counts.get(key) || 0) + 1);
        }

        Object.entries(byDate).forEach(([key, dayItems]) => {
          const n = (dayItems || []).filter((a) => this.isPipeline(a)).length;
          if (n > 0) counts.set(key, Math.max(counts.get(key) || 0, n));
        });

        const tabs: BoardDayTab[] = [];
        for (let i = 0; i <= 14; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          const key = this.localDateKey(d);
          const count = counts.get(key) || 0;
          if (count === 0 && i > 0) continue;
          tabs.push({
            date: key,
            label: this.dayTabLabel(d, i),
            count
          });
        }
        this.dayTabs = tabs.filter((t) => t.count > 0 || t.date === from);

        if (autoJump) {
          const todayCount = counts.get(from) || 0;
          if (todayCount === 0) {
            const next = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))[0];
            if (next) this.date = next[0];
          }
        }

        this.load();
      },
      error: () => this.load()
    });
  }

  private dayTabLabel(d: Date, offset: number): string {
    if (offset === 0) return 'Hoy';
    if (offset === 1) return 'Mañana';
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  load(): void {
    if (this.view === 'orders') {
      this.loadOrders();
    } else {
      this.loadKanban();
    }
  }

  private loadKanban(): void {
    this.loading = true;
    this.error = null;
    this.carwash.getBoard(this.date, this.locationUuid || undefined).subscribe({
      next: (res) => {
        const byStatus = res.data?.by_status || {};
        this.total = res.data?.total || 0;
        this.columns = ['scheduled', 'checked_in', 'in_progress', 'ready', 'delivered'].map((key) => ({
          key,
          label: this.columnLabel(key),
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

  private loadOrders(): void {
    this.loading = true;
    this.error = null;
    this.carwash
      .listAppointments({
        date: this.date || undefined,
        location_uuid: this.locationUuid || undefined,
        status: this.statusFilter || undefined,
        per_page: 100
      })
      .subscribe({
        next: (res) => {
          const page = res.data as { data?: CarWashAppointment[]; total?: number } | CarWashAppointment[];
          const rows = Array.isArray(page) ? page : page?.data || [];
          this.orders = rows;
          this.total = Array.isArray(page) ? rows.length : page?.total ?? rows.length;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'No se pudo cargar el listado de órdenes';
        }
      });
  }

  private columnLabel(key: string): string {
    const map: Record<string, string> = {
      scheduled: 'Agendadas',
      checked_in: 'Recepcionadas',
      in_progress: 'En lavado',
      ready: 'Listas',
      delivered: 'Entregadas'
    };
    return map[key] || this.statusLabels[key] || key;
  }

  advance(item: CarWashAppointment): void {
    const next = this.nextStatus[item.status];
    if (!next) return;
    this.setStatus(item, next);
  }

  setStatus(item: CarWashAppointment, status: string): void {
    if (!status || status === item.status) return;
    this.updatingUuid = item.uuid;
    this.error = null;
    this.carwash.updateStatus(item.uuid, status).subscribe({
      next: () => {
        this.updatingUuid = null;
        if (this.view === 'orders') {
          this.loadOrders();
          this.refreshDayTabs(false);
        } else {
          this.refreshDayTabs(false);
        }
      },
      error: (err) => {
        this.updatingUuid = null;
        this.error = err?.error?.message || 'No se pudo actualizar el estatus';
      }
    });
  }

  validateVin(item: CarWashAppointment): void {
    this.updatingUuid = item.uuid;
    this.carwash.validateAppointmentVin(item.uuid).subscribe({
      next: () => {
        this.updatingUuid = null;
        this.load();
      },
      error: (err) => {
        this.updatingUuid = null;
        this.error = err?.error?.message || 'No se pudo validar el VIN';
      }
    });
  }

  orderTypeLabel(item: CarWashAppointment): string {
    return item.order_type === 'internal_sales_delivery' ? 'Ventas' : 'Público';
  }

  channelLabel(channel: string | undefined): string {
    if (!channel) return '—';
    if (channel === 'whatsapp') return 'WhatsApp';
    if (channel === 'admin') return 'Admin';
    if (channel === 'pos') return 'POS';
    return channel;
  }
}
