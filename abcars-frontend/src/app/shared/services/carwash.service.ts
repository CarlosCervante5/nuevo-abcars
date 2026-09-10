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
  description?: string | null;
  duration_minutes: number;
  price: number | string;
  is_active: boolean;
  sort_order?: number;
}

export interface CarWashProduct {
  uuid: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  price: number | string;
  stock: number;
  is_active: boolean;
}

export interface CarWashLoyaltySettings {
  enabled: boolean;
  slots: number;
  reward_text: string;
  stamp_emoji: string;
  empty_emoji: string;
}

export interface CarWashLoyaltyCard {
  uuid?: string;
  customer_phone?: string | null;
  customer_name?: string | null;
  stamps_count: number;
  slots: number;
  remaining: number;
  completed_cycles: number;
  reward_text: string;
  punch_card: string;
  punch_card_lines?: string[];
  last_stamp_at?: string | null;
  message?: string;
}

export interface CarWashWasher {
  uuid: string;
  display_name: string;
  phone?: string | null;
  is_active: boolean;
  location?: CarWashLocation | null;
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

export interface CarWashWhatsAppConversation {
  uuid: string;
  phone: string;
  customer_name?: string | null;
  status: string;
  needs_human: boolean;
  last_message_at?: string | null;
}

export interface CarWashWhatsAppMessage {
  uuid: string;
  direction: 'inbound' | 'outbound' | string;
  body?: string | null;
  status?: string | null;
  created_at?: string;
}

export interface CarWashWhatsAppSettings {
  whatsapp_provider: string;
  evolution: {
    base_url: string;
    api_key: string;
    api_key_set?: boolean;
    instance: string;
    webhook_secret: string;
    webhook_secret_set?: boolean;
    timeout: number;
  };
  twilio: {
    account_sid: string;
    auth_token: string;
    auth_token_set?: boolean;
    from: string;
    webhook_secret: string;
    webhook_secret_set?: boolean;
    timeout: number;
  };
  agent: {
    enabled: boolean;
    history_limit: number;
    model: string;
    openai_api_key?: string;
    openai_api_key_set?: boolean;
  };
  public_whatsapp_phone?: string;
  webhook_urls?: { evolution: string; twilio: string };
  status?: { provider: string; configured: boolean; agent_enabled: boolean };
  connection?: { ok?: boolean; state?: string | null; error?: string | null };
}

export interface CarWashAppointment {
  uuid: string;
  customer_name: string;
  customer_phone: string;
  vehicle_plates?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_color?: string | null;
  vehicle_vin?: string | null;
  vehicle_condition?: 'new' | 'used' | string | null;
  order_type?: 'public' | 'internal_sales_delivery' | string;
  vin_validation_status?: string | null;
  requested_by_name?: string | null;
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
    const token = localStorage.getItem('user_token') || sessionStorage.getItem('user_token') || '';
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

  getCalendar(from: string, to: string, locationUuid?: string) {
    let params = new HttpParams().set('from', from).set('to', to);
    if (locationUuid) params = params.set('location_uuid', locationUuid);
    return this.http
      .get<{
        status: number;
        message: string;
        data: {
          from: string;
          to: string;
          total: number;
          by_date: Record<string, CarWashAppointment[]>;
          items: CarWashAppointment[];
          generated_at: string;
        };
      }>(`${this.baseUrl}/api/carwash/calendar`, {
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

  validateAppointmentVin(uuid: string) {
    return this.http
      .post<{ status: number; message: string; data: CarWashAppointment }>(
        `${this.baseUrl}/api/carwash/appointments/${uuid}/validate-vin`,
        {},
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

  listServiceTypes(includeInactive = false) {
    let params = new HttpParams();
    if (includeInactive) params = params.set('include_inactive', '1');
    return this.http
      .get<{ status: number; message: string; data: CarWashServiceType[] }>(`${this.baseUrl}/api/carwash/service-types`, {
        headers: this.authHeaders(),
        params
      })
      .pipe(catchError((e) => this.handleError(e)));
  }

  createServiceType(payload: {
    name: string;
    code: string;
    description?: string | null;
    duration_minutes: number;
    price: number;
    is_active?: boolean;
    sort_order?: number;
  }) {
    return this.http
      .post<{ status: number; message: string; data: CarWashServiceType }>(
        `${this.baseUrl}/api/carwash/service-types`,
        payload,
        { headers: this.authHeaders() }
      )
      .pipe(catchError((e) => this.handleError(e)));
  }

  updateServiceType(
    uuid: string,
    payload: Partial<{
      name: string;
      code: string;
      description: string | null;
      duration_minutes: number;
      price: number;
      is_active: boolean;
      sort_order: number;
    }>
  ) {
    return this.http
      .patch<{ status: number; message: string; data: CarWashServiceType }>(
        `${this.baseUrl}/api/carwash/service-types/${uuid}`,
        payload,
        { headers: this.authHeaders() }
      )
      .pipe(catchError((e) => this.handleError(e)));
  }

  deleteServiceType(uuid: string) {
    return this.http
      .delete<{ status: number; message: string; data: unknown }>(
        `${this.baseUrl}/api/carwash/service-types/${uuid}`,
        { headers: this.authHeaders() }
      )
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
    order_type?: 'public' | 'internal_sales_delivery';
    vehicle_vin?: string;
    vehicle_condition?: 'new' | 'used';
    vehicle_plates?: string;
    vehicle_brand?: string;
    vehicle_model?: string;
    vehicle_color?: string;
    requested_by_name?: string;
    scheduled_start_at?: string;
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

  whatsappStatus() {
    return this.http
      .get<{ status: number; message: string; data: { provider: string; configured: boolean; agent_enabled: boolean } }>(
        `${this.baseUrl}/api/carwash/whatsapp/status`,
        { headers: this.authHeaders() }
      )
      .pipe(catchError((e) => this.handleError(e)));
  }

  getWhatsAppSettings() {
    return this.http
      .get<{ status: number; message: string; data: CarWashWhatsAppSettings }>(
        `${this.baseUrl}/api/carwash/whatsapp/settings`,
        { headers: this.authHeaders() }
      )
      .pipe(catchError((e) => this.handleError(e)));
  }

  updateWhatsAppSettings(payload: Partial<CarWashWhatsAppSettings>) {
    return this.http
      .put<{ status: number; message: string; data: CarWashWhatsAppSettings }>(
        `${this.baseUrl}/api/carwash/whatsapp/settings`,
        payload,
        { headers: this.authHeaders() }
      )
      .pipe(catchError((e) => this.handleError(e)));
  }

  getWhatsAppConnection() {
    return this.http
      .get<{ status: number; message: string; data: { ok?: boolean; state?: string | null; error?: string | null } }>(
        `${this.baseUrl}/api/carwash/whatsapp/connection`,
        { headers: this.authHeaders() }
      )
      .pipe(catchError((e) => this.handleError(e)));
  }

  getWhatsAppQr() {
    return this.http
      .get<{
        status: number;
        message: string;
        data: {
          ok?: boolean;
          already_connected?: boolean;
          state?: string | null;
          base64?: string | null;
          pairing_code?: string | null;
          error?: string | null;
        };
      }>(`${this.baseUrl}/api/carwash/whatsapp/qr`, { headers: this.authHeaders() })
      .pipe(catchError((e) => this.handleError(e)));
  }

  listWhatsAppConversations(filters: { q?: string; needs_human?: boolean; per_page?: number } = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http
      .get<{ status: number; message: string; data: unknown }>(`${this.baseUrl}/api/carwash/whatsapp/conversations`, {
        headers: this.authHeaders(),
        params
      })
      .pipe(catchError((e) => this.handleError(e)));
  }

  getWhatsAppMessages(conversationUuid: string) {
    return this.http
      .get<{
        status: number;
        message: string;
        data: { conversation: CarWashWhatsAppConversation; messages: CarWashWhatsAppMessage[] };
      }>(`${this.baseUrl}/api/carwash/whatsapp/conversations/${conversationUuid}/messages`, {
        headers: this.authHeaders()
      })
      .pipe(catchError((e) => this.handleError(e)));
  }

  replyWhatsApp(conversationUuid: string, body: string) {
    return this.http
      .post<{ status: number; message: string; data: CarWashWhatsAppConversation }>(
        `${this.baseUrl}/api/carwash/whatsapp/conversations/${conversationUuid}/reply`,
        { body },
        { headers: this.authHeaders() }
      )
      .pipe(catchError((e) => this.handleError(e)));
  }

  updateWhatsAppHandoff(conversationUuid: string, needsHuman: boolean) {
    return this.http
      .patch<{ status: number; message: string; data: CarWashWhatsAppConversation }>(
        `${this.baseUrl}/api/carwash/whatsapp/conversations/${conversationUuid}/handoff`,
        { needs_human: needsHuman },
        { headers: this.authHeaders() }
      )
      .pipe(catchError((e) => this.handleError(e)));
  }

  getLoyaltySettings() {
    return this.http
      .get<{
        status: number;
        message: string;
        data: { settings: CarWashLoyaltySettings; tables_ready: boolean };
      }>(`${this.baseUrl}/api/carwash/loyalty/settings`, { headers: this.authHeaders() })
      .pipe(catchError((e) => this.handleError(e)));
  }

  updateLoyaltySettings(payload: Partial<CarWashLoyaltySettings>) {
    return this.http
      .put<{
        status: number;
        message: string;
        data: { settings: CarWashLoyaltySettings; tables_ready: boolean };
      }>(`${this.baseUrl}/api/carwash/loyalty/settings`, payload, { headers: this.authHeaders() })
      .pipe(catchError((e) => this.handleError(e)));
  }

  listLoyaltyCards() {
    return this.http
      .get<{
        status: number;
        message: string;
        data: { settings: CarWashLoyaltySettings; cards: CarWashLoyaltyCard[] };
      }>(`${this.baseUrl}/api/carwash/loyalty/cards`, { headers: this.authHeaders() })
      .pipe(catchError((e) => this.handleError(e)));
  }

  getPublicContact() {
    return this.http
      .get<{
        status: number;
        message: string;
        data: {
          phone_digits?: string | null;
          phone_tel?: string | null;
          phone_display?: string | null;
          whatsapp_url?: string | null;
          prefill?: string;
        };
      }>(`${this.baseUrl}/api/carwash/public/contact`)
      .pipe(catchError((e) => this.handleError(e)));
  }
}
