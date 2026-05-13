import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';

export interface IntelimotorSettings {
  business_unit_id: string | null;
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
}

export interface IntelimotorLinkedVehicle {
  uuid: string;
  name: string;
  vin: string;
  page_status: string;
  intelimotor_unit_id: string;
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

  getSettings(): Observable<IntelimotorApiEnvelope<IntelimotorSettings>> {
    return this.http.get<IntelimotorApiEnvelope<IntelimotorSettings>>(
      `${this.baseUrl}/settings`,
      { headers: this.authHeaders() }
    );
  }

  saveSettings(payload: {
    api_key?: string;
    api_secret?: string;
    business_unit_id?: string | null;
    base_url?: string;
    is_enabled?: boolean;
  }): Observable<IntelimotorApiEnvelope<IntelimotorSettings>> {
    return this.http.put<IntelimotorApiEnvelope<IntelimotorSettings>>(
      `${this.baseUrl}/settings`,
      payload,
      { headers: this.authHeaders() }
    );
  }

  testConnection(): Observable<IntelimotorApiEnvelope<IntelimotorProxyResult>> {
    return this.http.post<IntelimotorApiEnvelope<IntelimotorProxyResult>>(
      `${this.baseUrl}/test-connection`,
      {},
      { headers: this.authHeaders() }
    );
  }

  getUnits(pageNumber = 0, pageSize = 10): Observable<IntelimotorApiEnvelope<IntelimotorProxyResult>> {
    return this.http.get<IntelimotorApiEnvelope<IntelimotorProxyResult>>(
      `${this.baseUrl}/units`,
      {
        headers: this.authHeaders(),
        params: {
          pageNumber: String(pageNumber),
          pageSize: String(pageSize)
        }
      }
    );
  }

  createUnit(payload: Record<string, unknown>): Observable<IntelimotorApiEnvelope<IntelimotorProxyResult>> {
    return this.http.post<IntelimotorApiEnvelope<IntelimotorProxyResult>>(
      `${this.baseUrl}/units`,
      payload,
      { headers: this.authHeaders() }
    );
  }

  syncInventory(syncImages = true): Observable<IntelimotorApiEnvelope<IntelimotorSyncSummary>> {
    return this.http.post<IntelimotorApiEnvelope<IntelimotorSyncSummary>>(
      `${this.baseUrl}/sync-inventory`,
      { sync_images: syncImages },
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
}

