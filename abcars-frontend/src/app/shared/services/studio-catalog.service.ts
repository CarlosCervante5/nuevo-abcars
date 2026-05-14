import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { firstValueFrom, Observable } from 'rxjs';
import {
  STUDIO_CATALOG_DEFAULT_HEIGHT,
  STUDIO_CATALOG_DEFAULT_WIDTH,
} from '../utils/studio-catalog-background';

export interface StudioCatalogSettings {
  cyclorama_image_url: string | null;
  width: number;
  height: number;
  using_default: boolean;
  updated_at: string | null;
}

interface StudioCatalogEnvelope {
  status: number;
  message: string;
  data: StudioCatalogSettings;
}

@Injectable({ providedIn: 'root' })
export class StudioCatalogService {
  private readonly baseUrl = `${environment.baseUrl}/api/studio-catalog`;
  private cached: StudioCatalogSettings | null = null;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('user_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token ?? ''}`);
  }

  invalidateCache(): void {
    this.cached = null;
  }

  getBackgroundSettings(forceRefresh = false): Observable<StudioCatalogEnvelope> {
    return this.http.get<StudioCatalogEnvelope>(`${this.baseUrl}/background`, {
      headers: this.authHeaders(),
    });
  }

  async resolveCompositeOptions(forceRefresh = false): Promise<{
    backgroundUrl: string | null;
    width: number;
    height: number;
  }> {
    if (!forceRefresh && this.cached) {
      return {
        backgroundUrl: this.cached.using_default ? null : this.cached.cyclorama_image_url,
        width: this.cached.width || STUDIO_CATALOG_DEFAULT_WIDTH,
        height: this.cached.height || STUDIO_CATALOG_DEFAULT_HEIGHT,
      };
    }

    const response = await firstValueFrom(this.getBackgroundSettings(forceRefresh));
    this.cached = response.data;
    return {
      backgroundUrl: this.cached.using_default ? null : this.cached.cyclorama_image_url,
      width: this.cached.width || STUDIO_CATALOG_DEFAULT_WIDTH,
      height: this.cached.height || STUDIO_CATALOG_DEFAULT_HEIGHT,
    };
  }

  uploadBackground(file: File, width?: number, height?: number): Observable<StudioCatalogEnvelope> {
    const form = new FormData();
    form.append('image', file, file.name);
    if (width) {
      form.append('width', String(width));
    }
    if (height) {
      form.append('height', String(height));
    }

    return this.http.post<StudioCatalogEnvelope>(`${this.baseUrl}/background`, form, {
      headers: this.authHeaders(),
    });
  }

  resetBackground(): Observable<StudioCatalogEnvelope> {
    return this.http.delete<StudioCatalogEnvelope>(`${this.baseUrl}/background`, {
      headers: this.authHeaders(),
    });
  }
}
