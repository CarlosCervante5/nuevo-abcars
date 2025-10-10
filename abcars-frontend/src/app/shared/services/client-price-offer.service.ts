import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { GetClientPriceOffer } from '@interfaces/client_price_offer.interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientPriceOfferService {

  private baseUrl: string = environment.baseUrl;

  constructor(private _http: HttpClient) { }

  public getClientPriceOffer(page: number = 1): Observable<GetClientPriceOffer>{
    let user_token = localStorage.getItem('user_token');
    let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);

    return this._http.get<GetClientPriceOffer>(`${ this.baseUrl }/api/strega/leads/by_source?page=${ page }`, { headers });
  }

}
