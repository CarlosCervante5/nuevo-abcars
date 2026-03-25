import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';

export interface AssistantResponse {
  response: string;
  data: Record<string, unknown> | null;
}

@Injectable({
  providedIn: 'root'
})
export class AssistantService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  query(message: string): Observable<AssistantResponse> {
    const token = localStorage.getItem('user_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<AssistantResponse>(
      `${this.baseUrl}/api/assistant/query`,
      { message },
      { headers }
    );
  }
}
