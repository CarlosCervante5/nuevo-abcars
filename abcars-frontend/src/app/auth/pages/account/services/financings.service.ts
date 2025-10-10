import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Environments
import { environment } from 'src/environments/environment';

// Interfaces
import { Financing } from '../interfaces/financing.interface';

@Injectable({
  providedIn: 'root'
})

export class FinancingsService {

  // Global Url
  private url: string = environment.baseUrl;  

  constructor(private _http: HttpClient) { }

  /**
   * API Get financings by user_id
   */
  public getFinancingsByUser(user_id: number): Observable<Financing> {    
    return this._http.get<Financing>(`${ this.url }/api/financing/by/user/${ user_id }`);
  }

}
