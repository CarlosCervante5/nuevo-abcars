import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';

export interface ReferralStatsResponse {
  status: number;
  message: string;
  data: {
    total_referrals: number;
    month_referrals: number;
    converted_referrals: number;
  };
}

@Injectable({ providedIn: 'root' })
export class SellerReferralStatsService {
  private baseUrl = environment.baseUrl;
  constructor(private http: HttpClient) {}

  getStats(): Observable<ReferralStatsResponse> {
    const token = localStorage.getItem('user_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<ReferralStatsResponse>(
      `${this.baseUrl}/api/seller/referral-stats`,
      { headers }
    );
  }
}
