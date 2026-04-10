import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface FinancingFormData {
  name: string;
  last_name?: string;
  phone: string;
  email: string;
  city?: string;
  address?: string;
  occupation?: string;
  monthly_income?: string;
  company?: string;
  job_tenure?: string;
  comments?: string;
  /** Texto libre del simulador (marca, modelo, año, etc.) */
  vehicle_of_interest?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_price?: number;
  down_payment?: number;
  down_payment_percentage?: number;
  monthly_payment?: number;
  term_months?: number;
  finance_amount?: number;
}

export interface TestDriveFormData {
  name: string;
  phone: string;
  email: string;
  preferred_date?: string;
  preferred_time?: string;
  comments?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_uuid?: string;
}

export interface OfferFormData {
  name: string;
  last_name?: string;
  phone: string;
  email: string;
  city?: string;
  offer_amount: number;
  payment_conditions?: string;
  comments?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_uuid?: string;
}

export interface ValuationFormData {
  fullName: string;
  lastName?: string;
  phone: string;
  email: string;
  city?: string;
  preferredDate?: string;
  preferredTime?: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  referrer_uuid?: string;
}

export interface LeadResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private baseUrl: string = environment.baseUrl;
  private headers = new HttpHeaders()
    .set('content-type', 'application/json')
    .set('X-Requested-With', 'XMLHttpRequest');

  constructor(private http: HttpClient) { }

  /**
   * Enviar solicitud de financiamiento
   */
  sendFinancingRequest(data: FinancingFormData): Observable<LeadResponse> {
    return this.http.post<LeadResponse>(`${this.baseUrl}/api/leads/financing`, data, { headers: this.headers });
  }

  /**
   * Enviar solicitud de prueba de manejo
   */
  sendTestDriveRequest(data: TestDriveFormData): Observable<LeadResponse> {
    return this.http.post<LeadResponse>(`${this.baseUrl}/api/leads/test_drive`, data, { headers: this.headers });
  }

  /**
   * Enviar oferta de monto
   */
  sendOfferRequest(data: OfferFormData): Observable<LeadResponse> {
    return this.http.post<LeadResponse>(`${this.baseUrl}/api/leads/offer`, data, { headers: this.headers });
  }

  /**
   * Enviar solicitud de valuación
   */
  sendValuationRequest(data: ValuationFormData): Observable<LeadResponse> {
    return this.http.post<LeadResponse>(`${this.baseUrl}/api/leads/valuation`, data, { headers: this.headers });
  }
}

