import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Form
import { UntypedFormGroup } from '@angular/forms';

// HTTP Client
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Enviroment
import { environment } from 'src/environments/environment';

// Interfaces
import { 
  ClientServices, 
  RegisterQuote, 
  Services, 
  ServicesClient 
} from '../interfaces/services.interface';

@Injectable({
  providedIn: 'root'
})

export class ServicesService {

  // Global Url
  private url: string = environment.baseUrl;

  // Headers
  private headers = new HttpHeaders().set('Content-Type', 'application/json').set('X-Requested-With', 'XMLHttpRequest');        

  constructor(private _http: HttpClient) { }

  /**
   * API Register Quote
   */
   public registerQuote(quote: UntypedFormGroup): Observable<RegisterQuote>{
    return this._http.post<RegisterQuote> (`${ this.url }/api/quote`, quote, { 
      headers: this.headers.set('Authorization', JSON.stringify(localStorage.getItem('user_token'))) 
    });
  }

  /**
   * Get Services All
   */
  public getServices(): Observable<Services> {
    return this._http.get<Services>(`${ this.url }/api/services/customer`);
  }

  /**
   * API Get added services a client
   */
  public getServicesByUser(type: string, user_id: number): Observable <ServicesClient> {    
    return this._http.get<ServicesClient>(`${ this.url }/api/client/services/${ type }/${ user_id }`, { 
      headers: this.headers.set('Authorization', JSON.stringify(localStorage.getItem('user_token')))
    });
  }

  /**
   * API Get client by user_id
   */  
  public getClientByUser(user_id: number): Observable<ClientServices> {
    return this._http.get<ClientServices>(`${ this.url }/api/client/user_id/${ user_id }`, {
      headers: this.headers.set('Authorization', JSON.stringify(localStorage.getItem('user_token')))
    });
  }

  /**
   * API Register Service Quote
   */
   public registerServiceQuote(relationship: UntypedFormGroup): Observable<RegisterQuote>{
    return this._http.post<RegisterQuote> (`${ this.url }/api/quote/service`, relationship, { 
      headers: this.headers.set('Authorization', JSON.stringify(localStorage.getItem('user_token'))) 
    });
  }

}
