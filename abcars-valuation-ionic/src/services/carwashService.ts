import { getApiBaseUrl } from '../config/apiBaseUrl';

export interface CarWashPublicAppointment {
  uuid: string;
  status: string;
  status_label: string;
  customer_name: string;
  customer_phone: string;
  vehicle_plates?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_color?: string | null;
  scheduled_start_at?: string | null;
  scheduled_local?: string | null;
  quoted_price?: number | string | null;
  location?: { uuid: string; name: string; address?: string | null } | null;
  service_type?: {
    uuid: string;
    name: string;
    duration_minutes?: number;
    price?: number | string;
  } | null;
}

export interface CarWashTimelineStep {
  key: string;
  label: string;
  done: boolean;
  current: boolean;
  at?: string | null;
}

export interface CarWashPublicLoyalty {
  ok: boolean;
  enabled: boolean;
  stamps_count: number;
  slots: number;
  remaining: number;
  completed_cycles: number;
  reward_text: string;
  punch_card: string;
  punch_card_lines?: string[];
  message?: string;
}

export interface CarWashCustomerStatus {
  phone: string;
  appointment: CarWashPublicAppointment | null;
  timeline: CarWashTimelineStep[];
  loyalty: CarWashPublicLoyalty;
  history: Array<{
    uuid: string;
    status: string;
    scheduled_start_at?: string | null;
    service?: string | null;
    plates?: string | null;
  }>;
}

class CarWashService {
  async getCustomerStatus(phone: string, appointmentUuid?: string): Promise<CarWashCustomerStatus> {
    const base = getApiBaseUrl();
    const params = new URLSearchParams({ phone: phone.trim() });
    if (appointmentUuid) params.set('appointment_uuid', appointmentUuid);

    const res = await fetch(`${base}carwash/public/customer-status?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.message || 'No se pudo consultar CarWash');
    }
    return json.data as CarWashCustomerStatus;
  }
}

export const carwashService = new CarWashService();
