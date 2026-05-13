import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IntelimotorAccount,
  IntelimotorLinkedVehicle,
  IntelimotorProxyResult,
  IntelimotorService,
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
  accounts: IntelimotorAccount[] = [];
  selectedAccountUuid: string | null = null;
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

  formName = '';
  apiKey = '';
  apiSecret = '';
  businessUnitId = '';
  baseUrl = 'https://app.intelimotor.com/api';
  isEnabled = true;
  isNewAccount = true;

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
    this.loadAccounts();
    this.loadLinkedVehicles();
  }

  get selectedAccount(): IntelimotorAccount | null {
    if (!this.selectedAccountUuid) {
      return null;
    }
    return this.accounts.find((account) => account.uuid === this.selectedAccountUuid) ?? null;
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

  loadAccounts(): void {
    this.loading = true;
    this.error = null;

    this.intelimotorService.listAccounts().subscribe({
      next: (response) => {
        this.accounts = response.data ?? [];
        if (!this.selectedAccountUuid && this.accounts.length > 0) {
          this.selectAccount(this.accounts[0]);
        } else if (this.selectedAccountUuid) {
          const current = this.accounts.find((a) => a.uuid === this.selectedAccountUuid);
          if (current) {
            this.fillForm(current);
          } else {
            this.startNewAccount();
          }
        } else {
          this.startNewAccount();
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err) || 'No se pudieron cargar las cuentas Intelimotor';
        this.loading = false;
      }
    });
  }

  selectAccount(account: IntelimotorAccount): void {
    this.selectedAccountUuid = account.uuid;
    this.isNewAccount = false;
    this.fillForm(account);
    this.lastSyncSummary = account.last_sync_summary ?? null;
  }

  startNewAccount(): void {
    this.selectedAccountUuid = null;
    this.isNewAccount = true;
    this.formName = '';
    this.apiKey = '';
    this.apiSecret = '';
    this.businessUnitId = '';
    this.baseUrl = 'https://app.intelimotor.com/api';
    this.isEnabled = true;
    this.lastSyncSummary = null;
  }

  private fillForm(account: IntelimotorAccount): void {
    this.formName = account.name;
    this.apiKey = '';
    this.apiSecret = '';
    this.businessUnitId = account.business_unit_id ?? '';
    this.baseUrl = account.base_url || 'https://app.intelimotor.com/api';
    this.isEnabled = account.is_enabled;
  }

  saveAccount(): void {
    if (!this.formName.trim()) {
      this.error = 'Indica un nombre para la cuenta.';
      return;
    }

    this.saving = true;
    this.error = null;
    this.successMessage = null;

    const payload: Record<string, unknown> = {
      name: this.formName.trim(),
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

    const request$ = this.isNewAccount
      ? this.intelimotorService.createAccount(payload)
      : this.intelimotorService.updateAccount(this.selectedAccountUuid!, payload);

    request$.subscribe({
      next: (response) => {
        this.successMessage = this.isNewAccount ? 'Cuenta creada correctamente.' : 'Cuenta actualizada.';
        this.selectedAccountUuid = response.data.uuid;
        this.isNewAccount = false;
        this.apiKey = '';
        this.apiSecret = '';
        this.saving = false;
        this.loadAccounts();
      },
      error: (err) => {
        this.error = this.extractApiError(err) || 'No se pudo guardar la cuenta';
        this.saving = false;
      }
    });
  }

  deleteSelectedAccount(): void {
    if (!this.selectedAccountUuid || this.isNewAccount) {
      return;
    }
    if (!confirm('¿Eliminar esta cuenta Intelimotor? Los vehículos ya vinculados conservarán su historial.')) {
      return;
    }

    this.intelimotorService.deleteAccount(this.selectedAccountUuid).subscribe({
      next: () => {
        this.successMessage = 'Cuenta eliminada.';
        this.startNewAccount();
        this.loadAccounts();
      },
      error: (err) => {
        this.error = this.extractApiError(err) || 'No se pudo eliminar la cuenta';
      }
    });
  }

  testConnection(): void {
    if (!this.selectedAccountUuid) {
      this.error = 'Guarda y selecciona una cuenta antes de probar la conexión.';
      return;
    }

    this.testing = true;
    this.error = null;
    this.successMessage = null;

    this.intelimotorService.testConnection(this.selectedAccountUuid).subscribe({
      next: (response) => {
        this.lastProxyResult = response.data;
        this.successMessage = response.message;
        this.loadAccounts();
        this.testing = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err) || 'La prueba de conexión falló';
        this.loadAccounts();
        this.testing = false;
      }
    });
  }

  syncInventory(accountUuid?: string | null): void {
    this.syncingInventory = true;
    this.error = null;
    this.successMessage = null;

    this.intelimotorService.syncInventory(true, accountUuid ?? undefined).subscribe({
      next: (response) => {
        this.lastSyncSummary = response.data;
        const s = response.data;
        this.successMessage = `Sincronización completa: ${s.created} nuevos, ${s.updated} actualizados, ${s.marked_sold} marcados vendidos.`;
        this.loadAccounts();
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
    if (!this.selectedAccountUuid) {
      this.error = 'Selecciona una cuenta para consultar inventario.';
      return;
    }

    this.fetchingUnits = true;
    this.error = null;
    this.successMessage = null;

    this.intelimotorService.getUnits(this.selectedAccountUuid, 0, 10).subscribe({
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
    if (!this.selectedAccountUuid) {
      this.error = 'Selecciona una cuenta para enviar la unidad de prueba.';
      return;
    }

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

    this.intelimotorService.createUnit(this.selectedAccountUuid, payload).subscribe({
      next: (response) => {
        this.lastProxyResult = response.data;
        this.successMessage = response.message;
        this.creatingUnit = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err) || 'No se pudo crear la unidad de prueba';
        this.lastProxyResult = (err as { error?: { data?: IntelimotorProxyResult } })?.error?.data ?? null;
        this.creatingUnit = false;
      }
    });
  }

  connectionStatusLabel(account: IntelimotorAccount | null): string {
    if (!account?.last_connection_status) {
      return 'Sin pruebas';
    }
    return account.last_connection_status === 'success' ? 'Conectado' : 'Error';
  }

  connectionStatusClass(account: IntelimotorAccount | null): string {
    if (!account?.last_connection_status) {
      return 'bg-gray-100 text-gray-700';
    }
    return account.last_connection_status === 'success'
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
