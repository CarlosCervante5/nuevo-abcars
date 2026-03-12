import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface DeliveryPhoto {
  uuid: string;
  service_image_url: string;
  caption?: string;
  sort_order: number;
  created_at: string;
}

export interface DeliveryPhotosResponse {
  status: number;
  message: string;
  data: DeliveryPhoto[];
}

export interface DeliveryPhotosPaginatedResponse {
  status: number;
  message: string;
  data: {
    data: DeliveryPhoto[];
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryPhotosService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /** Listar fotos de entregas (público, para el home) - paginado */
  list(page = 1, perPage = 10): Observable<DeliveryPhotosPaginatedResponse> {
    const params = { page: String(page), per_page: String(perPage) };
    return this.http.get<DeliveryPhotosPaginatedResponse>(`${this.baseUrl}/api/delivery-photos`, { params });
  }

  /** Subir foto de entrega (requiere auth) */
  upload(image: File, caption?: string, sortOrder?: number): Observable<{ status: number; message: string; data?: unknown }> {
    const formData = new FormData();
    formData.append('image', image);
    if (caption != null && caption !== '') {
      formData.append('caption', caption);
    }
    if (sortOrder != null) {
      formData.append('sort_order', String(sortOrder));
    }

    const userToken = localStorage.getItem('user_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${userToken}`);

    return this.http.post<{ status: number; message: string; data?: unknown }>(
      `${this.baseUrl}/api/delivery-photos`,
      formData,
      { headers }
    );
  }

  /** Eliminar foto de entrega */
  delete(uuid: string): Observable<{ status: number; message: string }> {
    const userToken = localStorage.getItem('user_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${userToken}`);

    return this.http.delete<{ status: number; message: string }>(
      `${this.baseUrl}/api/delivery-photos/${uuid}`,
      { headers }
    );
  }
}
