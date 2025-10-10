import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Enviroment
import { environment } from 'src/environments/environment';

// Interfaces
import { Reserveds, UnReserved } from '../interfaces/reserved.interface';

@Injectable({
  providedIn: 'root'
})

export class ReservedService {

  // References
  private url: string = environment.baseUrl;  

  constructor(private _http: HttpClient) { }

  /**
   * Get choices by client
   */
  public getChoicesByClient(user_id: number): Observable<Reserveds> {
    return this._http.get<Reserveds>(`${ this.url }/api/choices/client/${ user_id }`);
  }

  /**
   * 
   * @param vin String
   * @returns Array
   */
  public unChoiceVehicle(vin: string): Observable<UnReserved> {
    return this._http.get<UnReserved>(`${ this.url }/api/DeleteApart/${ vin }`);
  }
}
