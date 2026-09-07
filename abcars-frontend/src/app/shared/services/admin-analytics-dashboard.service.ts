import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, catchError, throwError } from 'rxjs';

export interface DashboardFilters {
  start_date: string;
  end_date: string;
  dealership_id?: number | null;
}

export interface TopSoldItem {
  brand_name: string;
  total_sold: number;
}

export interface RecentSoldItem {
  vehicle_name: string;
  brand_name: string;
  sale_price: number;
  dealership_name: string;
  sold_date: string;
}

export interface MostRequestedItem {
  dealership_name: string;
  appointment_count: number;
  ask_info_count: number;
  total_requests: number;
}

export interface MostValuatedItem {
  dealership_name: string;
  total_valuations: number;
  avg_final_offer: number;
}

export interface LongestInventoryItem {
  vehicle_name: string;
  brand_name: string;
  days_in_inventory: number;
  list_price: number;
  dealership_name: string;
}

export interface PriceHistoryPoint {
  date: string;
  avg_sale_price: number | null;
  avg_list_price: number | null;
  avg_offer_price: number | null;
}

export interface VehiclePriceChange {
  date: string;
  old_sale_price: number | null;
  new_sale_price: number | null;
  old_list_price: number | null;
  new_list_price: number | null;
  old_offer_price: number | null;
  new_offer_price: number | null;
}

export interface DealershipItem {
  id: number;
  name: string;
  location: string;
}

export interface PublishLogFilters {
  start_date: string;
  end_date: string;
  vehicle_uuid?: string | null;
  user_id?: number | null;
  to_status?: string | null;
  limit?: number;
}

export interface PublishLogItem {
  id: number;
  at: string;
  source: string;
  from_status: string | null;
  to_status: string | null;
  vehicle_uuid: string | null;
  vehicle_name: string | null;
  vin: string | null;
  user_email: string | null;
  user_id: number | null;
  meta: Record<string, unknown>;
}

interface ApiResponse<T> {
  data: T;
  filters: DashboardFilters;
}

@Injectable({
  providedIn: 'root'
})
export class AdminAnalyticsDashboardService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('user_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  private buildParams(filters: DashboardFilters): HttpParams {
    let params = new HttpParams()
      .set('start_date', filters.start_date)
      .set('end_date', filters.end_date);
    if (filters.dealership_id) {
      params = params.set('dealership_id', filters.dealership_id.toString());
    }
    return params;
  }

  private handleError(error: unknown) {
    return throwError(() => error);
  }

  getTopSold(filters: DashboardFilters): Observable<ApiResponse<TopSoldItem[]>> {
    return this.http.get<ApiResponse<TopSoldItem[]>>(
      `${this.baseUrl}/api/admin/analytics/top-sold`,
      { headers: this.getHeaders(), params: this.buildParams(filters) }
    ).pipe(catchError(this.handleError));
  }

  getRecentSold(filters: DashboardFilters): Observable<ApiResponse<RecentSoldItem[]>> {
    return this.http.get<ApiResponse<RecentSoldItem[]>>(
      `${this.baseUrl}/api/admin/analytics/recent-sold`,
      { headers: this.getHeaders(), params: this.buildParams(filters) }
    ).pipe(catchError(this.handleError));
  }

  getMostRequested(filters: DashboardFilters): Observable<ApiResponse<MostRequestedItem[]>> {
    return this.http.get<ApiResponse<MostRequestedItem[]>>(
      `${this.baseUrl}/api/admin/analytics/most-requested`,
      { headers: this.getHeaders(), params: this.buildParams(filters) }
    ).pipe(catchError(this.handleError));
  }

  getMostValuated(filters: DashboardFilters): Observable<ApiResponse<MostValuatedItem[]>> {
    return this.http.get<ApiResponse<MostValuatedItem[]>>(
      `${this.baseUrl}/api/admin/analytics/most-valuated`,
      { headers: this.getHeaders(), params: this.buildParams(filters) }
    ).pipe(catchError(this.handleError));
  }

  getLongestInventory(filters: DashboardFilters): Observable<ApiResponse<LongestInventoryItem[]>> {
    return this.http.get<ApiResponse<LongestInventoryItem[]>>(
      `${this.baseUrl}/api/admin/analytics/longest-inventory`,
      { headers: this.getHeaders(), params: this.buildParams(filters) }
    ).pipe(catchError(this.handleError));
  }

  getPriceHistory(filters: DashboardFilters, vehicleId?: number): Observable<ApiResponse<PriceHistoryPoint[] | VehiclePriceChange[]>> {
    let params = this.buildParams(filters);
    if (vehicleId) {
      params = params.set('vehicle_id', vehicleId.toString());
    }
    return this.http.get<ApiResponse<PriceHistoryPoint[] | VehiclePriceChange[]>>(
      `${this.baseUrl}/api/admin/analytics/price-history`,
      { headers: this.getHeaders(), params }
    ).pipe(catchError(this.handleError));
  }

  getDealerships(): Observable<{ data: DealershipItem[] }> {
    return this.http.get<{ data: DealershipItem[] }>(
      `${this.baseUrl}/api/admin/analytics/dealerships`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  getPublishLog(filters: PublishLogFilters): Observable<{ data: PublishLogItem[]; filters: PublishLogFilters }> {
    let params = new HttpParams()
      .set('start_date', filters.start_date)
      .set('end_date', filters.end_date)
      .set('limit', String(filters.limit ?? 100));

    if (filters.vehicle_uuid?.trim()) {
      params = params.set('vehicle_uuid', filters.vehicle_uuid.trim());
    }
    if (filters.user_id) {
      params = params.set('user_id', filters.user_id.toString());
    }
    if (filters.to_status) {
      params = params.set('to_status', filters.to_status);
    }

    return this.http.get<{ data: PublishLogItem[]; filters: PublishLogFilters }>(
      `${this.baseUrl}/api/admin/analytics/publish-log`,
      { headers: this.getHeaders(), params }
    ).pipe(catchError(this.handleError));
  }
}
