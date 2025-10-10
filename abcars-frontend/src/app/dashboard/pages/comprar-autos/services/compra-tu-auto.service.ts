import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// Interfaces
import { DataBrands } from './../interfaces/compra-tu-auto/data_brands.interface';
import { DataModels } from './../interfaces/compra-tu-auto/data_models.interface';
import { DataYears } from './../interfaces/compra-tu-auto/data_years.interface';
import { DataTransmissions } from './../interfaces/compra-tu-auto/data_transmissions.interface';
import { DataVehicleBody } from './../interfaces/compra-tu-auto/data_vehiclebodies.interface';
import { DataStates } from '../interfaces/compra-tu-auto/data_states.interface';
import { DataBuscador, MinMaxPrices } from './../interfaces/compra-tu-auto/data_buscador.interface';

@Injectable({
  providedIn: 'root'
})

export class CompraTuAutoService {

  private baseUrl:string = environment.baseUrl;

  constructor(private _http:HttpClient) { }

  public getBrands( modelNames:string, years:string, carrocerias:string, minPrice: number, price:number, states:string, transmisions:string ): Observable<DataBrands>{    
    let headers = new HttpHeaders().set('content-type', 'application/json').set('X-Requested-With', 'XMLHttpRequest');        
    return this._http.get<DataBrands>(`${ this.baseUrl }/api/brandsByActiveVehicles/${ modelNames }/${ years }/${ carrocerias }/${ minPrice }/${ price }/${ states }/${ transmisions }`, {headers: headers});
  }

  public getModels( brandNames:string, years:string, carrocerias:string, minPrice: number, price:number, states:string, transmisions:string ): Observable<DataModels>{
    return this._http.get<DataModels>(`${ this.baseUrl }/api/modelsByActiveVehicles/${ brandNames }/${ years }/${ carrocerias }/${ minPrice }/${ price }/${ states }/${ transmisions }`);
  }

  public getYears( brandNames:string, modelNames:string, carrocerias:string, minPrice: number, price:number, states:string, transmisions:string ): Observable<DataYears>{
    return this._http.get<DataYears>(`${ this.baseUrl }/api/yearsByActiveVehicles/${ brandNames }/${ modelNames }/${ carrocerias }/${ minPrice }/${ price }/${ states }/${ transmisions }`);
  }

  public getVehicleBodies( brandNames:string, modelNames:string, years:string, minPrice: number, price:number, states:string, transmisions:string ): Observable<DataVehicleBody>{
    return this._http.get<DataVehicleBody>(`${ this.baseUrl }/api/vehiclebodiesByActiveVehicles/${ brandNames }/${ modelNames }/${ years }/${ minPrice }/${ price }/${ states }/${ transmisions }`);
  }

  public getStates( brandNames:string, modelNames:string, carrocerias:string, years:string, minPrice: number, price:number, transmisions:string ): Observable<DataStates>{
    return this._http.get<DataStates>(`${ this.baseUrl }/api/statesByActiveVehicles/${ brandNames }/${ modelNames }/${ carrocerias }/${ years }/${ minPrice }/${ price }/${ transmisions }`);
  }

  public getTransmissions( brandNames:string, modelNames:string, carrocerias:string, years:string, minPrice: number, price:number, states:string ): Observable<DataTransmissions>{
    return this._http.get<DataTransmissions>(`${ this.baseUrl }/api/transmissionsByActiveVehicles/${ brandNames }/${ modelNames }/${ carrocerias }/${ years }/${ minPrice }/${ price }/${ states }`);
  }

  public getVehicles( cantidad:number, brandNames:string, modelNames:string, years:string, carrocerias:string, minPrice: number, price:number, word:string, orden:string = 'vacio', page:number, states:string, transmisions:string ): Observable<DataBuscador>{
    return this._http.get<DataBuscador>(`${ this.baseUrl }/api/vehiclesSearch/${ cantidad }/${ brandNames }/${ modelNames }/${ years }/${ carrocerias }/${ minPrice }/${ price }/${ word }/${ orden }/${ states }/${ transmisions }?page=${ page }`);
  }

  public getVehiclesAll( cantidad:number, brandNames:string, modelNames:string, years:string, carrocerias:string, minPrice: number, price:number, word:string, orden:string = 'vacio', page:number, states:string ): Observable<DataBuscador>{
    return this._http.get<DataBuscador>(`${ this.baseUrl }/api/vehiclesSearchAll/${ cantidad }/${ brandNames }/${ modelNames }/${ years }/${ carrocerias }/${ minPrice }/${ price }/${ word }/${ orden }/${ states }?page=${ page }`);
  }

  public getPromoVehicles(cantidad: number, brandNames:string, modelNames:string, years:string, carrocerias:string, price:number, word:string, orden:string = 'vacio', page:number, states:string): Observable<DataBuscador>{
    return this._http.get<DataBuscador>(`${ this.baseUrl }/api/vehicles_sales/${ cantidad }/${ brandNames }/${ modelNames }/${ years }/${ carrocerias }/${ price }/${ word }/${ orden }/${ states }?page=${ page }`)
  }

  public getMinMaxPrices(): Observable<MinMaxPrices>{
    return this._http.get<MinMaxPrices>(`${ this.baseUrl }/api/getMinMaxPrices/`)
  }

}
