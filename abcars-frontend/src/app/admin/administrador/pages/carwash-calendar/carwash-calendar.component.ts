import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  CarWashAppointment,
  CarWashLocation,
  CarWashService
} from '@services/carwash.service';

interface CalendarDay {
  date: string;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  count: number;
  items: CarWashAppointment[];
}

@Component({
  selector: 'app-carwash-calendar',
  standalone: true,
  templateUrl: './carwash-calendar.component.html',
  styleUrls: ['./carwash-calendar.component.css'],
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule]
})
export class CarWashCalendarComponent implements OnInit, OnDestroy {
  readonly weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  locations: CarWashLocation[] = [];
  locationUuid = '';
  viewYear = new Date().getFullYear();
  viewMonth = new Date().getMonth(); // 0-11
  selectedDate = this.toDateKey(new Date());
  days: CalendarDay[] = [];
  byDate: Record<string, CarWashAppointment[]> = {};
  selectedItems: CarWashAppointment[] = [];
  total = 0;
  loading = false;
  error: string | null = null;
  lastSync: string | null = null;
  live = true;

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

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private carwash: CarWashService) {}

  ngOnInit(): void {
    this.carwash.listLocations().subscribe({
      next: (res) => (this.locations = res.data || [])
    });
    this.load(true);
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  get monthLabel(): string {
    const d = new Date(this.viewYear, this.viewMonth, 1);
    return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  }

  get selectedDateLabel(): string {
    const [y, m, d] = this.selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  prevMonth(): void {
    if (this.viewMonth === 0) {
      this.viewMonth = 11;
      this.viewYear -= 1;
    } else {
      this.viewMonth -= 1;
    }
    this.load(true);
  }

  nextMonth(): void {
    if (this.viewMonth === 11) {
      this.viewMonth = 0;
      this.viewYear += 1;
    } else {
      this.viewMonth += 1;
    }
    this.load(true);
  }

  goToday(): void {
    const now = new Date();
    this.viewYear = now.getFullYear();
    this.viewMonth = now.getMonth();
    this.selectedDate = this.toDateKey(now);
    this.load(true);
  }

  selectDay(day: CalendarDay): void {
    if (!day.inMonth) {
      const d = new Date(day.date + 'T12:00:00');
      this.viewYear = d.getFullYear();
      this.viewMonth = d.getMonth();
      this.selectedDate = day.date;
      this.load(true);
      return;
    }
    this.selectedDate = day.date;
    this.refreshSelected();
    this.buildGrid();
  }

  toggleLive(): void {
    this.live = !this.live;
    if (this.live) {
      this.startPolling();
      this.load(false);
    } else {
      this.stopPolling();
    }
  }

  load(showSpinner = true): void {
    if (showSpinner) this.loading = true;
    this.error = null;

    const from = this.toDateKey(new Date(this.viewYear, this.viewMonth, 1));
    const to = this.toDateKey(new Date(this.viewYear, this.viewMonth + 1, 0));

    this.carwash.getCalendar(from, to, this.locationUuid || undefined).subscribe({
      next: (res) => {
        this.byDate = res.data?.by_date || {};
        this.total = res.data?.total || 0;
        this.lastSync = res.data?.generated_at || new Date().toISOString();
        this.buildGrid();
        this.refreshSelected();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'No se pudo cargar el calendario';
      }
    });
  }

  advance(item: CarWashAppointment): void {
    const next = this.nextStatus[item.status];
    if (!next) return;
    this.carwash.updateStatus(item.uuid, next).subscribe({
      next: () => this.load(false),
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo actualizar el estatus';
      }
    });
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      if (this.live) this.load(false);
    }, 15000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private refreshSelected(): void {
    this.selectedItems = [...(this.byDate[this.selectedDate] || [])].sort((a, b) =>
      String(a.scheduled_start_at || '').localeCompare(String(b.scheduled_start_at || ''))
    );
  }

  private buildGrid(): void {
    const first = new Date(this.viewYear, this.viewMonth, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday-first
    const gridStart = new Date(this.viewYear, this.viewMonth, 1 - startOffset);
    const todayKey = this.toDateKey(new Date());
    const cells: CalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const key = this.toDateKey(d);
      const items = this.byDate[key] || [];
      cells.push({
        date: key,
        dayNumber: d.getDate(),
        inMonth: d.getMonth() === this.viewMonth,
        isToday: key === todayKey,
        isSelected: key === this.selectedDate,
        count: items.length,
        items
      });
    }
    this.days = cells;
  }

  private toDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
