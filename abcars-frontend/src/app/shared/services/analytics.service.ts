import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface AnalyticsStats {
  period_days: number;
  start_date: string;
  page_views: {
    total: number;
    unique_sessions: number;
    by_day: { date: string; total: number }[];
  };
  form_submissions: {
    total: number;
    by_type: Record<string, number>;
    by_day: { date: string; total: number }[];
  };
  valuations: { total: number };
  appointments: { total: number };
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private url = environment.baseUrl;

  constructor(private http: HttpClient) {}

  trackPageView(path: string, referrer?: string): Observable<unknown> {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    const body = { path, referrer: referrer || '' };
    const headers = { 'X-Session-Id': sessionId };
    return this.http.post(`${this.url}/api/analytics/page-view`, body, { headers });
  }

  getStats(days: number = 30): Observable<AnalyticsStats> {
    const token = localStorage.getItem('user_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<AnalyticsStats>(`${this.url}/api/analytics/stats?days=${days}`, { headers });
  }
}
