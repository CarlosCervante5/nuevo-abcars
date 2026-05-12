import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { BodyHypOrdersListResponse } from '@interfaces/body-hyp-order.interface';
import { GralResponse } from '@interfaces/vehicle_data.interface';

export type CreateBodyHypOrderPayload = {
  title?: string | null;
  description: string;
};

@Injectable({
  providedIn: 'root',
})
export class BodyHypOrderService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private readonly http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('user_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  list(page: number = 1, perPage: number = 15): Observable<BodyHypOrdersListResponse> {
    let params = new HttpParams().set('page', String(page)).set('per_page', String(perPage));
    return this.http.get<BodyHypOrdersListResponse>(`${this.baseUrl}/api/body-hyp-orders`, {
      headers: this.authHeaders(),
      params,
    });
  }

  create(payload: CreateBodyHypOrderPayload): Observable<GralResponse> {
    return this.http.post<GralResponse>(`${this.baseUrl}/api/body-hyp-orders`, payload, {
      headers: this.authHeaders(),
    });
  }
}
