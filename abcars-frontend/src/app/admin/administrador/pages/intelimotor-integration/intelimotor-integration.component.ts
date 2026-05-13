import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IntelimotorLinkedVehicle,
  IntelimotorProxyResult,
  IntelimotorService,
  IntelimotorSettings,
  IntelimotorSyncSummary,
  IntelimotorUnitSummary
} from '@services/intelimotor.service';

@Component({
  selector: 'app-intelimotor-integration',
  templateUrl: './intelimotor-integration.component.html',
  styleUrls: ['./intelimotor-integration.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class IntelimotorIntegrationComponent implements OnInit {
  settings: IntelimotorSettings | null = null;
  loading = true;
  saving = false;
  testing = false;
  fetchingUnits = false;
  syncingInventory = false;
  loadingLinked = false;
  pushingPhotosUuid: string | null = null;
  creatingUnit = false;
  error: string | null = null;
  successMessage: string | null = null;

  apiKey = '';
  apiSecret = '';
  businessUnitId = '';
  baseUrl = 'https://app.intelimotor.com/api';
  isEnabled = false;

  unitsPreview: IntelimotorUnitSummary[] = [];
  linkedVehicles: IntelimotorLinkedVehicle[] = [];
  lastSyncSummary: IntelimotorSyncSummary | null = null;
  unitsPagination: Record<string, number> | null = null;
  lastProxyResult: IntelimotorProxyResult | null = null;

  sampleUnitJson = `{
  "ref": "VIN-EJEMPLO-001",
  "vin": "VIN-EJEMPLO-001",
  "brandIds": ["REEMPLAZA_BRAND_ID"],
  "modelIds": ["REEMPLAZA_MODEL_ID"],
  "yearIds": ["REEMPLAZA_YEAR_ID"],
  "trimIds": [],
  "useCustomTrim": true,
  "customTrim": "1.5 Fun Mt",
  "kms": 45000,
  "type": "owned",
  "consignmentFee": 0,
  "buyPrice": 220000,
  "buyDate": 1644818400000,
  "listPrice": 285000,
  "externalBrand": "",
  "externalModel": "",
  "externalYear": "",
  "externalTrim": ""
}`;

  createUnitPayload = this.sampleUnitJson;

  constructor(private intelimotorService: IntelimotorService) {}

  ngOnInit(): void {
    this.loadSettings();
    this.loadLinkedVehicles();
  }

  loadLinkedVehicles(): void {
    this.loadingLinked = true;
    this.intelimotorService.getLinkedVehicles().subscribe({
      next: (response) => {
        this.linkedVehicles = response.data ?? [];
        this.loadingLinked = false;
      },
      error: () => {
        this.loadingLinked = false;
      }
    });
  }

  private extractApiError(err: unknown): string {
    const body = (err as { error?: { message?: string } })?.error;
    const message = body?.message;
    if (typeof message === 'string' && message.trim()) {
      return message.replace(/^Hubo un problema con su solicitud:\s*/i, '');
    }
    return 'Ocurrió un error al comunicarse con el servidor.';
  }

  loadSettings(): void {
    this.loading = true;
    this.error = null;

    this.intelimotorService.getSettings().subscribe({
      next: (response) => {
        this.settings = response.data;
        this.businessUnitId = response.data.business_unit_id ?? '';
        this.baseUrl = response.data.base_url || 'https://app.intelimotor.com/api';
        this.isEnabled = response.data.is_enabled;
        this.lastSyncSummary = response.data.last_sync_summary ?? null;
        this.loading = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err) || 'No se pudo cargar la configuración de Intelimotor';
        this.loading = false;
      }
    });
  }

  saveSettings(): void {
    this.saving = true;
    this.error = null;
    this.successMessage = null;

    const payload: Record<string, unknown> = {
      business_unit_id: this.businessUnitId || null,
      base_url: this.baseUrl,
      is_enabled: this.isEnabled
    };

    if (this.apiKey.trim()) {
      payload['api_key'] = this.apiKey.trim();
    }

    if (this.apiSecret.trim()) {
      payload['api_secret'] = this.apiSecret.trim();
    }

    this.intelimotorService.saveSettings(payload).subscribe({
      next: (response) => {
        this.settings = response.data;
        this.apiKey = '';
        this.apiSecret = '';
        this.successMessage = 'Configuración guardada correctamente.';
        this.saving = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err) || 'No se pudo guardar la configuración';
        this.saving = false;
      }
    });
  }

  testConnection(): void {
    this.testing = true;
    this.error = null;
    this.successMessage = null;

    this.intelimotorService.testConnection().subscribe({
      next: (response) => {
        this.lastProxyResult = response.data;
        this.successMessage = response.message;
        this.loadSettings();
        this.testing = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err) || 'La prueba de conexión falló';
        this.loadSettings();
        this.testing = false;
      }
    });
  }

  syncInventory(): void {
    this.syncingInventory = true;
    this.error = null;
    this.successMessage = null;

    this.intelimotorService.syncInventory(true).subscribe({
      next: (response) => {
        this.lastSyncSummary = response.data;
        this.successMessage = `Sincronización completa: ${response.data.created} nuevos, ${response.data.updated} actualizados, ${response.data.marked_sold} marcados vendidos.`;
        this.loadSettings();
        this.loadLinkedVehicles();
        this.syncingInventory = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err) || 'No se pudo sincronizar el inventario';
        this.syncingInventory = false;
      }
    });
  }

  pushPhotos(vehicle: IntelimotorLinkedVehicle): void {
    this.pushingPhotosUuid = vehicle.uuid;
    this.error = null;
    this.successMessage = null;

    this.intelimotorService.pushVehiclePhotos(vehicle.uuid).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.pushingPhotosUuid = null;
        this.loadLinkedVehicles();
      },
      error: (err) => {
        this.error = this.extractApiError(err) || 'No se pudieron enviar las fotos a Intelimotor';
        this.pushingPhotosUuid = null;
      }
    });
  }

  pageStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Activo',
      inactive: 'Inactivo',
      sale: 'Vendido',
      valuing: 'Valuación'
    };
    return labels[status] || status;
  }

  fetchUnits(): void {
    this.fetchingUnits = true;
    this.error = null;
    this.successMessage = null;

    this.intelimotorService.getUnits(0, 10).subscribe({
      next: (response) => {
        this.lastProxyResult = response.data;
        const payload = response.data?.data as {
          data?: IntelimotorUnitSummary[];
          pagination?: Record<string, number>;
        } | null;

        this.unitsPreview = Array.isArray(payload?.data) ? payload.data : [];
        this.unitsPagination = payload?.pagination ?? null;
        this.successMessage = `Inventario consultado (${this.unitsPreview.length} unidades en esta página).`;
        this.fetchingUnits = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err) || 'No se pudo consultar el inventario';
        this.fetchingUnits = false;
      }
    });
  }

  createTestUnit(): void {
    this.creatingUnit = true;
    this.error = null;
    this.successMessage = null;

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(this.createUnitPayload);
    } catch {
      this.error = 'El JSON de prueba para crear unidad no es válido.';
      this.creatingUnit = false;
      return;
    }

    this.intelimotorService.createUnit(payload).subscribe({
      next: (response) => {
        this.lastProxyResult = response.data;
        this.successMessage = response.message;
        this.creatingUnit = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err) || 'No se pudo crear la unidad de prueba';
        this.lastProxyResult = err?.error?.data ?? null;
        this.creatingUnit = false;
      }
    });
  }

  connectionStatusLabel(): string {
    if (!this.settings?.last_connection_status) {
      return 'Sin pruebas';
    }

    return this.settings.last_connection_status === 'success' ? 'Conectado' : 'Error';
  }

  connectionStatusClass(): string {
    if (!this.settings?.last_connection_status) {
      return 'bg-gray-100 text-gray-700';
    }

    return this.settings.last_connection_status === 'success'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }

  unitBrand(unit: IntelimotorUnitSummary): string {
    return unit.brands?.[0]?.name || '—';
  }

  unitModel(unit: IntelimotorUnitSummary): string {
    return unit.models?.[0]?.name || '—';
  }

  unitYear(unit: IntelimotorUnitSummary): string {
    return unit.years?.[0]?.name || '—';
  }
}
