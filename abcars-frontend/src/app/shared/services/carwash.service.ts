import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, catchError, throwError } from 'rxjs';

export interface CarWashLocation {
  uuid: string;
  name: string;
  code?: string | null;
  phone?: string | null;
  address?: string | null;
  is_active: boolean;
}

export interface CarWashServiceType {
  uuid: string;
  name: string;
  code: string;
  duration_minutes: number;
  price: number | string;
  is_active: boolean;
}

export interface CarWashWasher {
  uuid: string;
  display_name: string;
  phone?: string | null;
  is_active: boolean;
  location?: CarWashLocation | null;
}

export interface CarWashProduct {
  uuid: string;
  name: string;
  sku?: string | null;
  price: number | string;
  stock: number;
  is_active: boolean;
}

export interface CarWashOrderItem {
  uuid: string;
  item_type: string;
  name: string;
  quantity: number;
  unit_price: number | string;
  line_total: number | string;
}

export interface CarWashOrder {
  uuid: string;
  status: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  subtotal: number | string;
  total: number | string;
  payment_method?: string | null;
  paid_at?: string | null;
  notes?: string | null;
  items?: CarWashOrderItem[];
  location?: CarWashLocation | null;
}

export interface CarWashAppointment {
  uuid: string;
  customer_name: string;
  customer_phone: string;
  vehicle_plates?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_color?: string | null;
  status: string;
  channel: string;
  scheduled_start_at?: string | null;
  scheduled_end_at?: string | null;
  quoted_price?: number | string | null;
  notes?: string | null;
  location?: CarWashLocation | null;
  service_type?: CarWashServiceType | null;
  washer?: CarWashWasher | null;
}

export interface CarWashBoardResponse {
  date: string;
  total: number;
  by_status: Record<string, CarWashAppointment[]>;
  items: CarWashAppointment[];
}

@Injectable({ providedIn: 'root' })
export class CarWashService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      Accept: 'application/json'
    });
  }

  private handleError(error: unknown) {
    return throwError(() => error);
  }

  getBoard(date?: string, locationUuid?: string): Observable<{ status: number; message: string; data: CarWashBoardResponse }> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    if (locationUuid) params = params.set('location_uuid', locationUuid);
    return this.http
      .get<{ status: number; message: string; data: CarWashBoardResponse }>(`${this.baseUrl}/api/carwash/board`, {
        headers: this.authHeaders(),
        params
      })
      .pipe(catchError((e) => this.handleError(e)));
  }

  listAppointments(filters: { date?: string; status?: string; location_uuid?: string; per_page?: number } = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http
      .get<{ status: number; message: string; data: unknown }>(`${this.baseUrl}/api/carwash/appointments`, {
        headers: this.authHeaders(),
        params
      })
      .pipe(catchError((e) => this.handleError(e)));
  }

  createAppointment(payload: Record<string, unknown>) {
    return this.http
      .post<{ status: number; message: string; data: CarWashAppointment }>(
        `${this.baseUrl}/api/carwash/appointments`,
        payload,
        { headers: this.authHeaders() }
      )
      .pipe(catchError((e) => this.handleError(e)));
  }

  updateStatus(uuid: string, status: string) {
    return this.http
      .patch<{ status: number; message: string; data: CarWashAppointment }>(
        `${this.baseUrl}/api/carwash/appointments/${uuid}/status`,
        { status },
        { headers: this.authHeaders() }
      )
      .pipe(catchError((e) => this.handleError(e)));
  }

  listLocations() {
    return this.http
      .get<{ status: number; message: string; data: CarWashLocation[] }>(`${this.baseUrl}/api/carwash/locations`, {
        headers: this.authHeaders()
      })
      .pipe(catchError((e) => this.handleError(e)));
  }

  listServiceTypes() {
    return this.http
      .get<{ status: number; message: string; data: CarWashServiceType[] }>(`${this.baseUrl}/api/carwash/service-types`, {
        headers: this.authHeaders()
      })
      .pipe(catchError((e) => this.handleError(e)));
  }

  listWashers(locationUuid?: string) {
    let params = new HttpParams();
    if (locationUuid) params = params.set('location_uuid', locationUuid);
    return this.http
      .get<{ status: number; message: string; data: CarWashWasher[] }>(`${this.baseUrl}/api/carwash/washers`, {
        headers: this.authHeaders(),
        params
      })
      .pipe(catchError((e) => this.handleError(e)));
  }

  listProducts() {
    return this.http
      .get<{ status: number; message: string; data: CarWashProduct[] }>(`${this.baseUrl}/api/carwash/products`, {
        headers: this.authHeaders()
      })
      .pipe(catchError((e) => this.handleError(e)));
  }

  listOrders(filters: { location_uuid?: string; status?: string; per_page?: number } = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http
      .get<{ status: number; message: string; data: unknown }>(`${this.baseUrl}/api/carwash/orders`, {
        headers: this.authHeaders(),
        params
      })
      .pipe(catchError((e) => this.handleError(e)));
  }

  checkout(payload: {
    location_uuid: string;
    appointment_uuid?: string;
    customer_name?: string;
    customer_phone?: string;
    payment_method: string;
    notes?: string;
    items: Array<{ item_type: 'service' | 'product'; uuid: string; quantity: number }>;
  }) {
    return this.http
      .post<{ status: number; message: string; data: CarWashOrder }>(
        `${this.baseUrl}/api/carwash/pos/checkout`,
        payload,
        { headers: this.authHeaders() }
      )
      .pipe(catchError((e) => this.handleError(e)));
  }
}
