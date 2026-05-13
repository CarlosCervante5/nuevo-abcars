import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';

export interface IntelimotorAccount {
  uuid: string;
  name: string;
  business_unit_id: string | null;
  default_dealership_id: number | null;
  base_url: string;
  is_enabled: boolean;
  has_credentials: boolean;
  api_key_masked: string | null;
  api_secret_masked: string | null;
  last_connection_at: string | null;
  last_connection_status: 'success' | 'error' | null;
  last_connection_message: string | null;
  last_sync_at?: string | null;
  last_sync_summary?: IntelimotorSyncSummary | null;
}

export interface IntelimotorApiEnvelope<T = unknown> {
  status: number;
  message: string;
  data: T;
}

export interface IntelimotorProxyResult {
  success: boolean;
  status: number;
  data: unknown;
  error: string | null;
}

export interface IntelimotorSyncSummary {
  total_remote: number;
  visible_remote: number;
  created: number;
  updated: number;
  marked_sold: number;
  images_synced: number;
  skipped: number;
  skipped_not_visible: number;
  errors: Array<{ unit_id?: string; message: string }>;
  accounts?: Array<IntelimotorSyncSummary & { account_uuid: string; account_name: string }>;
}

export interface IntelimotorSchedulerSettings {
  is_enabled: boolean;
  interval_minutes: number;
  sync_images: boolean;
  last_run_at: string | null;
  last_run_summary: IntelimotorSyncSummary | null;
  last_run_error: string | null;
  interval_options: number[];
}

export interface IntelimotorLinkedVehicle {
  uuid: string;
  name: string;
  vin: string;
  page_status: string;
  intelimotor_unit_id: string;
  intelimotor_account_uuid?: string | null;
  intelimotor_account_name?: string | null;
  intelimotor_ref: string | null;
  intelimotor_synced_at: string | null;
  images_count: number;
}

export interface IntelimotorUnitSummary {
  id?: string;
  ref?: string;
  vin?: string;
  kms?: number;
  listPrice?: number;
  brands?: Array<{ id?: string; name?: string }>;
  models?: Array<{ id?: string; name?: string }>;
  years?: Array<{ id?: string; name?: string }>;
  businessUnit?: { id?: string; name?: string };
}

@Injectable({
  providedIn: 'root'
})
export class IntelimotorService {
  private readonly baseUrl = `${environment.baseUrl}/api/integrations/intelimotor`;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('user_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token ?? ''}`);
  }

  listAccounts(): Observable<IntelimotorApiEnvelope<IntelimotorAccount[]>> {
    return this.http.get<IntelimotorApiEnvelope<IntelimotorAccount[]>>(
      `${this.baseUrl}/accounts`,
      { headers: this.authHeaders() }
    );
  }

  createAccount(payload: Record<string, unknown>): Observable<IntelimotorApiEnvelope<IntelimotorAccount>> {
    return this.http.post<IntelimotorApiEnvelope<IntelimotorAccount>>(
      `${this.baseUrl}/accounts`,
      payload,
      { headers: this.authHeaders() }
    );
  }

  updateAccount(accountUuid: string, payload: Record<string, unknown>): Observable<IntelimotorApiEnvelope<IntelimotorAccount>> {
    return this.http.put<IntelimotorApiEnvelope<IntelimotorAccount>>(
      `${this.baseUrl}/accounts/${accountUuid}`,
      payload,
      { headers: this.authHeaders() }
    );
  }

  deleteAccount(accountUuid: string): Observable<IntelimotorApiEnvelope<null>> {
    return this.http.delete<IntelimotorApiEnvelope<null>>(
      `${this.baseUrl}/accounts/${accountUuid}`,
      { headers: this.authHeaders() }
    );
  }

  testConnection(accountUuid: string): Observable<IntelimotorApiEnvelope<IntelimotorProxyResult>> {
    return this.http.post<IntelimotorApiEnvelope<IntelimotorProxyResult>>(
      `${this.baseUrl}/accounts/${accountUuid}/test-connection`,
      {},
      { headers: this.authHeaders() }
    );
  }

  getUnits(accountUuid: string, pageNumber = 0, pageSize = 10): Observable<IntelimotorApiEnvelope<IntelimotorProxyResult>> {
    return this.http.get<IntelimotorApiEnvelope<IntelimotorProxyResult>>(
      `${this.baseUrl}/accounts/${accountUuid}/units`,
      {
        headers: this.authHeaders(),
        params: {
          pageNumber: String(pageNumber),
          pageSize: String(pageSize),
          isSold: 'false'
        }
      }
    );
  }

  createUnit(accountUuid: string, payload: Record<string, unknown>): Observable<IntelimotorApiEnvelope<IntelimotorProxyResult>> {
    return this.http.post<IntelimotorApiEnvelope<IntelimotorProxyResult>>(
      `${this.baseUrl}/units`,
      { ...payload, account_uuid: accountUuid },
      { headers: this.authHeaders() }
    );
  }

  syncInventory(syncImages = true, accountUuid?: string | null): Observable<IntelimotorApiEnvelope<IntelimotorSyncSummary>> {
    const body: Record<string, unknown> = { sync_images: syncImages };
    if (accountUuid) {
      body['account_uuid'] = accountUuid;
    }

    return this.http.post<IntelimotorApiEnvelope<IntelimotorSyncSummary>>(
      `${this.baseUrl}/sync-inventory`,
      body,
      { headers: this.authHeaders() }
    );
  }

  getLinkedVehicles(): Observable<IntelimotorApiEnvelope<IntelimotorLinkedVehicle[]>> {
    return this.http.get<IntelimotorApiEnvelope<IntelimotorLinkedVehicle[]>>(
      `${this.baseUrl}/linked-vehicles`,
      { headers: this.authHeaders() }
    );
  }

  pushVehiclePhotos(vehicleUuid: string): Observable<IntelimotorApiEnvelope<Record<string, unknown>>> {
    return this.http.post<IntelimotorApiEnvelope<Record<string, unknown>>>(
      `${this.baseUrl}/vehicles/${vehicleUuid}/push-photos`,
      {},
      { headers: this.authHeaders() }
    );
  }

  getSchedulerSettings(): Observable<IntelimotorApiEnvelope<IntelimotorSchedulerSettings>> {
    return this.http.get<IntelimotorApiEnvelope<IntelimotorSchedulerSettings>>(
      `${this.baseUrl}/scheduler`,
      { headers: this.authHeaders() }
    );
  }

  updateSchedulerSettings(payload: Partial<IntelimotorSchedulerSettings>): Observable<IntelimotorApiEnvelope<IntelimotorSchedulerSettings>> {
    return this.http.put<IntelimotorApiEnvelope<IntelimotorSchedulerSettings>>(
      `${this.baseUrl}/scheduler`,
      payload,
      { headers: this.authHeaders() }
    );
  }

  runScheduledSyncNow(): Observable<IntelimotorApiEnvelope<{ summary: IntelimotorSyncSummary; scheduler: IntelimotorSchedulerSettings }>> {
    return this.http.post<IntelimotorApiEnvelope<{ summary: IntelimotorSyncSummary; scheduler: IntelimotorSchedulerSettings }>>(
      `${this.baseUrl}/scheduler/run`,
      {},
      { headers: this.authHeaders() }
    );
  }
}
