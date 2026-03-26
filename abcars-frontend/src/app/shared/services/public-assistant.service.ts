import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AssistantResponse {
  response: string;
  data: any | null;
}

@Injectable({
  providedIn: 'root'
})
export class PublicAssistantService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  sendMessage(message: string, conversationHistory: ChatMessage[]): Observable<AssistantResponse> {
    const history = conversationHistory.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });

    return this.http.post<AssistantResponse>(
      `${this.baseUrl}/api/public-assistant/query`,
      { message, conversation_history: history },
      { headers }
    ).pipe(timeout(30000));
  }
}
