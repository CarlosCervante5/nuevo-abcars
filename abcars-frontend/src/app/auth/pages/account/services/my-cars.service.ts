import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// HTTP Client
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Enviroment
import { environment } from 'src/environments/environment';

// Interfaces
import { VehicleUser } from '../interfaces/my-cars.interface';

@Injectable({
  providedIn: 'root'
})

export class MyCarsService {

  // Global Url
  private url: string = environment.baseUrl;  

  constructor(private _http: HttpClient) { }

  /**
   * API Get vehicles by client_id
   */
  public getVehiclesByUser(client_id: number): Observable<VehicleUser> {    
    return this._http.get<VehicleUser>(`${ this.url }/api/getVehiclesPurchasedByClient/${ client_id }`);
  }

}
