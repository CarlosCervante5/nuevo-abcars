import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CarWashService, CarWashWhatsAppSettings } from '@services/carwash.service';

@Component({
  selector: 'app-carwash-settings',
  standalone: true,
  templateUrl: './carwash-settings.component.html',
  styleUrls: ['./carwash-settings.component.css'],
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule]
})
export class CarWashSettingsComponent implements OnInit {
  loading = false;
  saving = false;
  checking = false;
  error: string | null = null;
  success: string | null = null;
  settings: CarWashWhatsAppSettings | null = null;
  connectionState: string | null = null;
  connectionError: string | null = null;

  form = {
    whatsapp_provider: 'evolution' as 'evolution' | 'twilio',
    evolution: {
      base_url: '',
      api_key: '',
      instance: '',
      webhook_secret: '',
      timeout: 30
    },
    twilio: {
      account_sid: '',
      auth_token: '',
      from: '',
      webhook_secret: '',
      timeout: 30
    },
    agent: {
      enabled: true,
      history_limit: 12,
      model: 'gpt-4o-mini'
    },
    public_whatsapp_phone: ''
  };

  constructor(private carwash: CarWashService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.carwash.getWhatsAppSettings().subscribe({
      next: (res) => {
        this.settings = res.data;
        this.applyToForm(res.data);
        this.connectionState = res.data.connection?.state || null;
        this.connectionError = res.data.connection?.error || null;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'No se pudieron cargar los settings';
      }
    });
  }

  save(): void {
    this.saving = true;
    this.error = null;
    this.success = null;

    const payload = {
      whatsapp_provider: this.form.whatsapp_provider,
      evolution: { ...this.form.evolution },
      twilio: { ...this.form.twilio },
      agent: { ...this.form.agent },
      public_whatsapp_phone: this.form.public_whatsapp_phone
    };

    this.carwash.updateWhatsAppSettings(payload).subscribe({
      next: (res) => {
        this.saving = false;
        this.settings = res.data;
        this.applyToForm(res.data);
        this.success = 'Configuración WhatsApp guardada';
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'No se pudo guardar';
      }
    });
  }

  refreshConnection(): void {
    this.checking = true;
    this.connectionError = null;
    this.carwash.getWhatsAppConnection().subscribe({
      next: (res) => {
        this.checking = false;
        this.connectionState = res.data.state || null;
        this.connectionError = res.data.ok ? null : res.data.error || 'Sin respuesta';
      },
      error: (err) => {
        this.checking = false;
        this.connectionError = err?.error?.message || 'No se pudo consultar Evolution';
      }
    });
  }

  private applyToForm(data: CarWashWhatsAppSettings): void {
    this.form.whatsapp_provider = (data.whatsapp_provider as 'evolution' | 'twilio') || 'evolution';
    this.form.evolution = {
      base_url: data.evolution?.base_url || '',
      api_key: data.evolution?.api_key_set ? '' : data.evolution?.api_key || '',
      instance: data.evolution?.instance || '',
      webhook_secret: data.evolution?.webhook_secret_set ? '' : data.evolution?.webhook_secret || '',
      timeout: data.evolution?.timeout || 30
    };
    this.form.twilio = {
      account_sid: data.twilio?.account_sid || '',
      auth_token: data.twilio?.auth_token_set ? '' : data.twilio?.auth_token || '',
      from: data.twilio?.from || '',
      webhook_secret: data.twilio?.webhook_secret_set ? '' : data.twilio?.webhook_secret || '',
      timeout: data.twilio?.timeout || 30
    };
    this.form.agent = {
      enabled: data.agent?.enabled !== false,
      history_limit: data.agent?.history_limit || 12,
      model: data.agent?.model || 'gpt-4o-mini'
    };
    this.form.public_whatsapp_phone = data.public_whatsapp_phone || '';
  }
}
