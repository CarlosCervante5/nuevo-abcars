import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AnalyticsService, AnalyticsStats } from '@services/analytics.service';
import { AnalyticsDashboardComponent } from '../analytics-dashboard/analytics-dashboard.component';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AnalyticsDashboardComponent]
})
export class AnalyticsComponent implements OnInit {
  /** Si true: sin breadcrumb; pensado para incrustar en el resumen del panel. */
  @Input() embedded = false;

  stats: AnalyticsStats | null = null;
  loading = true;
  error: string | null = null;
  selectedDays = 30;

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
