import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

import { GetUsersByRol } from '@interfaces/admin.interfaces';
import { GetStatisticalAccount } from '@interfaces/getStatisticalAccount.interfaces';

export interface ValuationReportRow {
  fecha_valuacion: string;
  vin: string;
  estatus: string;
  marca: string;
  modelo: string;
  version: string;
  color: string;
  anio: string | number;
  kilometraje: string | number;
  nombre_valuador: string;
  nombre_cliente: string;
  nombre_mecanico: string;
  ref_libro_toma: number | string;
  ref_libro_venta: number | string;
  ref_intelimotor_baja: number | string;
  ref_intelimotor_alta: number | string;
  partes_originales: number | string;
  partes_genericas: number | string;
  partes_usadas: number | string;
  reacond_mano_obra: number | string;
  reacond_hyp: number | string;
  reacond_total: number | string;
  valor_toma: number | string;
  oferta_final: number | string;
  comentarios: string;
  uuid: string;
}

export interface ValuationReportFilters {
  valuator_uuid?: string | null;
  begin_date?: string | null;
  end_date?: string | null;
  keyword?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ValuatorManagerPrintService {

  private baseUrl: string = environment.baseUrl;

  constructor(
    private _http: HttpClient
  ) { }

  private authHeaders(): HttpHeaders {
    const user_token = localStorage.getItem('user_token') || '';
    return new HttpHeaders().set('Authorization', `Bearer ${user_token}`);
  }

  private filterParams(filters: ValuationReportFilters, format?: string): HttpParams {
    let params = new HttpParams();
    if (filters.valuator_uuid) params = params.set('valuator_uuid', filters.valuator_uuid);
    if (filters.begin_date) params = params.set('begin_date', filters.begin_date);
    if (filters.end_date) params = params.set('end_date', filters.end_date);
    if (filters.keyword) params = params.set('keyword', filters.keyword);
    if (format) params = params.set('format', format);
    return params;
  }

  public getValuators(): Observable<GetUsersByRol>{
    const form: FormData = new FormData();
    form.append('role_name', 'valuator');
    return this._http.post<GetUsersByRol>(`${ this.baseUrl }/api/users/by_role`, form, {
      headers: this.authHeaders()
    });
  }

  public getStatisticalAccount(): Observable<GetStatisticalAccount>{
    return this._http.post<GetStatisticalAccount>(`${ this.baseUrl }/api/valuations/count`, {});
  }

  public previewReport(filters: ValuationReportFilters) {
    return this._http.get<{
      status: number;
      message: string;
      data: { count: number; columns: string[]; rows: ValuationReportRow[] };
    }>(`${this.baseUrl}/api/valuations/report`, {
      headers: this.authHeaders(),
      params: this.filterParams(filters, 'json')
    });
  }

  public downloadReportExcel(filters: ValuationReportFilters) {
    return this._http.get(`${this.baseUrl}/api/valuations/report`, {
      headers: this.authHeaders(),
      params: this.filterParams(filters, 'xlsx'),
      responseType: 'blob'
    });
  }

}
