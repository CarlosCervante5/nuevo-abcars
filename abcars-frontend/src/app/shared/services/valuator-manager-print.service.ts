import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

import { GetUsersByRol } from '@interfaces/admin.interfaces';
import { GetStatisticalAccount } from '@interfaces/getStatisticalAccount.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ValuatorManagerPrintService {

  private baseUrl: string = environment.baseUrl;

  constructor(
    private _http: HttpClient
  ) { }

  public getValuators(): Observable<GetUsersByRol>{
    let user_token = localStorage.getItem('user_token');
    let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);
    
    const form: FormData = new FormData();

    form.append('role_name', 'valuator');

    return this._http.post<GetUsersByRol>(`${ this.baseUrl }/api/users/by_role`, form, { headers });
  }

  public getStatisticalAccount(): Observable<GetStatisticalAccount>{
    return this._http.post<GetStatisticalAccount>(`${ this.baseUrl }/api/valuations/count`, {});
  }

}
