import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration } from 'chart.js';

import {
  AdminAnalyticsDashboardService,
  DashboardFilters,
  TopSoldItem,
  RecentSoldItem,
  MostRequestedItem,
  MostValuatedItem,
  LongestInventoryItem,
  PriceHistoryPoint,
  DealershipItem
} from '@services/admin-analytics-dashboard.service';

Chart.register(...registerables);

interface SectionState<T> {
  loading: boolean;
  error: string | null;
  data: T[];
}

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    BaseChartDirective
  ],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.css']
})
export class AnalyticsDashboardComponent implements OnInit {

  // Filter state
  selectedPeriod = 30;
  selectedDealership: number | null = null;
  dealerships: DealershipItem[] = [];

  periodOptions = [
    { value: 7, label: 'Últimos 7 días' },
    { value: 30, label: 'Últimos 30 días' },
    { value: 60, label: 'Últimos 60 días' },
    { value: 90, label: 'Últimos 90 días' }
  ];

  // Section states
  topSold: SectionState<TopSoldItem> = { loading: false, error: null, data: [] };
  recentSold: SectionState<RecentSoldItem> = { loading: false, error: null, data: [] };
  mostRequested: SectionState<MostRequestedItem> = { loading: false, error: null, data: [] };
  mostValuated: SectionState<MostValuatedItem> = { loading: false, error: null, data: [] };
  longestInventory: SectionState<LongestInventoryItem> = { loading: false, error: null, data: [] };
  priceHistory: SectionState<PriceHistoryPoint> = { loading: false, error: null, data: [] };

  // Chart configs
  topSoldChart: ChartConfiguration<'bar'> | null = null;
  mostRequestedChart: ChartConfiguration<'bar'> | null = null;
  mostValuatedChart: ChartConfiguration<'bar'> | null = null;
  priceHistoryChart: ChartConfiguration<'line'> | null = null;

  constructor(private analyticsService: AdminAnalyticsDashboardService) {}

  ngOnInit(): void {
    this.loadDealerships();
    this.loadAllData();
  }

  private getFilters(): DashboardFilters {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - this.selectedPeriod);
    return {
      start_date: this.toDateString(start),
      end_date: this.toDateString(end),
      dealership_id: this.selectedDealership
    };
  }

  private toDateString(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  onFilterChange(): void {
    this.loadAllData();
  }

  private loadDealerships(): void {
    this.analyticsService.getDealerships().subscribe({
      next: (res) => this.dealerships = res.data,
      error: () => this.dealerships = []
    });
  }

  loadAllData(): void {
    const filters = this.getFilters();
    this.loadTopSold(filters);
    this.loadRecentSold(filters);
    this.loadMostRequested(filters);
    this.loadMostValuated(filters);
    this.loadLongestInventory(filters);
    this.loadPriceHistory(filters);
  }

  private loadTopSold(filters: DashboardFilters): void {
    this.topSold = { loading: true, error: null, data: [] };
    this.analyticsService.getTopSold(filters).subscribe({
      next: (res) => {
        this.topSold = { loading: false, error: null, data: res.data };
        this.buildTopSoldChart(res.data);
      },
      error: () => {
        this.topSold = { loading: false, error: 'Error al cargar vehículos más vendidos', data: [] };
        this.topSoldChart = null;
      }
    });
  }

  private loadRecentSold(filters: DashboardFilters): void {
    this.recentSold = { loading: true, error: null, data: [] };
    this.analyticsService.getRecentSold(filters).subscribe({
      next: (res) => this.recentSold = { loading: false, error: null, data: res.data },
      error: () => this.recentSold = { loading: false, error: 'Error al cargar ventas recientes', data: [] }
    });
  }

  private loadMostRequested(filters: DashboardFilters): void {
    this.mostRequested = { loading: true, error: null, data: [] };
    this.analyticsService.getMostRequested(filters).subscribe({
      next: (res) => {
        this.mostRequested = { loading: false, error: null, data: res.data };
        this.buildMostRequestedChart(res.data);
      },
      error: () => {
        this.mostRequested = { loading: false, error: 'Error al cargar vehículos más solicitados', data: [] };
        this.mostRequestedChart = null;
      }
    });
  }

  private loadMostValuated(filters: DashboardFilters): void {
    this.mostValuated = { loading: true, error: null, data: [] };
    this.analyticsService.getMostValuated(filters).subscribe({
      next: (res) => {
        this.mostValuated = { loading: false, error: null, data: res.data };
        this.buildMostValuatedChart(res.data);
      },
      error: () => {
        this.mostValuated = { loading: false, error: 'Error al cargar vehículos más valuados', data: [] };
        this.mostValuatedChart = null;
      }
    });
  }

  private loadLongestInventory(filters: DashboardFilters): void {
    this.longestInventory = { loading: true, error: null, data: [] };
    this.analyticsService.getLongestInventory(filters).subscribe({
      next: (res) => this.longestInventory = { loading: false, error: null, data: res.data },
      error: () => this.longestInventory = { loading: false, error: 'Error al cargar antigüedad en inventario', data: [] }
    });
  }

  private loadPriceHistory(filters: DashboardFilters): void {
    this.priceHistory = { loading: true, error: null, data: [] };
    this.analyticsService.getPriceHistory(filters).subscribe({
      next: (res) => {
        this.priceHistory = { loading: false, error: null, data: res.data as PriceHistoryPoint[] };
        this.buildPriceHistoryChart(res.data as PriceHistoryPoint[]);
      },
      error: () => {
        this.priceHistory = { loading: false, error: 'Error al cargar historial de precios', data: [] };
        this.priceHistoryChart = null;
      }
    });
  }

  // Chart builders
  private buildTopSoldChart(data: TopSoldItem[]): void {
    if (!data.length) { this.topSoldChart = null; return; }
    this.topSoldChart = {
      type: 'bar',
      data: {
        labels: data.map(d => d.brand_name),
        datasets: [{
          label: 'Unidades vendidas',
          data: data.map(d => d.total_sold),
          backgroundColor: '#FFC73A',
          borderColor: '#e6b235',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    };
  }

  private buildMostRequestedChart(data: MostRequestedItem[]): void {
    if (!data.length) { this.mostRequestedChart = null; return; }
    this.mostRequestedChart = {
      type: 'bar',
      data: {
        labels: data.map(d => d.dealership_name),
        datasets: [
          {
            label: 'Solicitudes info',
            data: data.map(d => d.ask_info_count),
            backgroundColor: '#FFC73A'
          },
          {
            label: 'Citas',
            data: data.map(d => d.appointment_count),
            backgroundColor: '#1f2937'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    };
  }

  private buildMostValuatedChart(data: MostValuatedItem[]): void {
    if (!data.length) { this.mostValuatedChart = null; return; }
    this.mostValuatedChart = {
      type: 'bar',
      data: {
        labels: data.map(d => d.dealership_name),
        datasets: [{
          label: 'Valuaciones',
          data: data.map(d => d.total_valuations),
          backgroundColor: '#FFC73A',
          borderColor: '#e6b235',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const item = data[ctx.dataIndex];
                return `Promedio oferta: $${(item.avg_final_offer || 0).toLocaleString()}`;
              }
            }
          }
        },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    };
  }

  private buildPriceHistoryChart(data: PriceHistoryPoint[]): void {
    if (!data.length) { this.priceHistoryChart = null; return; }
    this.priceHistoryChart = {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [
          {
            label: 'Precio venta (prom.)',
            data: data.map(d => d.avg_sale_price ?? 0),
            borderColor: '#FFC73A',
            backgroundColor: 'rgba(255,199,58,0.1)',
            tension: 0.3,
            fill: false
          },
          {
            label: 'Precio lista (prom.)',
            data: data.map(d => d.avg_list_price ?? 0),
            borderColor: '#1f2937',
            backgroundColor: 'rgba(31,41,55,0.1)',
            tension: 0.3,
            fill: false
          },
          {
            label: 'Precio oferta (prom.)',
            data: data.map(d => d.avg_offer_price ?? 0),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.1)',
            tension: 0.3,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: (value) => '$' + Number(value).toLocaleString()
            }
          }
        }
      }
    };
  }

  formatCurrency(value: number): string {
    if (!value) return '$0';
    return '$' + value.toLocaleString('es-MX');
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
