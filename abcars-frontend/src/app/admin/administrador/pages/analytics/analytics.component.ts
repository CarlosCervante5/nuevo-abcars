import { Component, OnInit } from '@angular/core';
import { AnalyticsService, AnalyticsStats } from '@services/analytics.service';
import { Overview } from '@interfaces/admin.interfaces';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
  standalone: false
})
export class AnalyticsComponent implements OnInit {
  stats: AnalyticsStats | null = null;
  loading = true;
  error: string | null = null;
  selectedDays = 30;
  private user = JSON.parse(localStorage.getItem('user')!);
  public itemOverview: Overview = {
    user: {
      name: this.user.name,
      surname: this.user.surname,
      role: localStorage.getItem('role') === 'super_admin' ? 'Super Admin' : 'Admin',
      email: this.user.email,
      picturepath: ''
    },
    pages: []
  };

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;
    this.analyticsService.getStats(this.selectedDays).subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Error al cargar estadísticas';
        this.loading = false;
      }
    });
  }

  onDaysChange(): void {
    this.loadStats();
  }

  getFormTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      ask_information: 'Solicitud de información',
      financing: 'Financiamiento',
      test_drive: 'Prueba de manejo',
      offer: 'Oferta de monto',
      valuation: 'Valuación',
      reception_form: 'Formulario de recepción',
      riders_quiz: 'Cuestionario Riders',
      car_care: 'Car Care'
    };
    return labels[type] || type;
  }

  getBarWidth(value: number): number {
    if (!this.stats?.page_views?.by_day?.length) return 0;
    const max = Math.max(...this.stats.page_views.by_day.map(d => d.total), 1);
    return Math.min(100, (value / max) * 100);
  }
}
