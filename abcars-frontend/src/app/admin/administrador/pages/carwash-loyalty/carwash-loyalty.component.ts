import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  CarWashLoyaltyCard,
  CarWashLoyaltySettings,
  CarWashService
} from '@services/carwash.service';

@Component({
  selector: 'app-carwash-loyalty',
  standalone: true,
  templateUrl: './carwash-loyalty.component.html',
  styleUrls: ['./carwash-loyalty.component.css'],
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule]
})
export class CarWashLoyaltyComponent implements OnInit {
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  tablesReady = true;
  cards: CarWashLoyaltyCard[] = [];

  form: CarWashLoyaltySettings = {
    enabled: true,
    slots: 10,
    reward_text: 'Lavado gratis (paquete básico)',
    stamp_emoji: '🛒',
    empty_emoji: '⬜'
  };

  previewCard = '';

  constructor(private carwash: CarWashService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.carwash.listLoyaltyCards().subscribe({
      next: (res) => {
        this.applySettings(res.data.settings);
        this.cards = res.data.cards || [];
        this.tablesReady = true;
        this.loading = false;
        this.updatePreview();
      },
      error: (err) => {
        // Fallback a settings si cards falla por tablas
        this.carwash.getLoyaltySettings().subscribe({
          next: (res) => {
            this.applySettings(res.data.settings);
            this.tablesReady = !!res.data.tables_ready;
            this.loading = false;
            this.updatePreview();
            if (!this.tablesReady) {
              this.error = 'Falta migrar tablas de loyalty. Ejecuta bootstrap CarWash o migrate.';
            }
          },
          error: () => {
            this.loading = false;
            this.error = err?.error?.message || 'No se pudo cargar loyalty';
          }
        });
      }
    });
  }

  save(): void {
    this.saving = true;
    this.error = null;
    this.success = null;
    this.carwash.updateLoyaltySettings({ ...this.form }).subscribe({
      next: (res) => {
        this.saving = false;
        this.applySettings(res.data.settings);
        this.tablesReady = !!res.data.tables_ready;
        this.success = 'Programa de cuponera guardado';
        this.updatePreview();
        this.loadCardsOnly();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'No se pudo guardar';
      }
    });
  }

  updatePreview(): void {
    const slots = Math.max(1, Math.min(20, Number(this.form.slots) || 10));
    const filled = this.form.stamp_emoji || '🛒';
    const empty = this.form.empty_emoji || '⬜';
    const sample = Math.min(3, slots);
    const parts: string[] = [];
    for (let i = 0; i < slots; i++) {
      parts.push(i < sample ? filled : empty);
    }
    this.previewCard = parts.join('');
  }

  private loadCardsOnly(): void {
    this.carwash.listLoyaltyCards().subscribe({
      next: (res) => {
        this.cards = res.data.cards || [];
      }
    });
  }

  private applySettings(settings: CarWashLoyaltySettings): void {
    this.form = {
      enabled: settings?.enabled !== false,
      slots: settings?.slots || 10,
      reward_text: settings?.reward_text || 'Lavado gratis (paquete básico)',
      stamp_emoji: settings?.stamp_emoji || '🛒',
      empty_emoji: settings?.empty_emoji || '⬜'
    };
  }
}
