import { Injectable } from '@angular/core';
import { Form, UntypedFormGroup } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// // Interfaces
// import { VehicleData, Notification, LocationData } from './../../interfaces/detail/vehicle_data.interface'; 
import { RecommendedCarsData } from '../../interfaces/detail/recommended_cars_data.interface';
// import { UserById } from '../../interfaces/detail/user.interface';

@Injectable({
  providedIn: 'root'
})

export class DetailService {

  private baseUrl:string = environment.baseUrl;
  private headers = new HttpHeaders().set('content-type', 'application/json').set('X-Requested-With', 'XMLHttpRequest');        

  constructor(private _http:HttpClient) { }
  // public getLocationvehiclesId(id:number):Observable<LocationData>{ 
  //   return this._http.get<LocationData>(`${ this.baseUrl}/api/getLocationvehiclesId/${ id }`, {headers: this.headers})
  // }
  // public getVehicleById( vehicle_id: number ): Observable<VehicleData>{        
  //   return this._http.get<VehicleData>(`${ this.baseUrl }/api/vehicleById/${ vehicle_id }`, {headers: this.headers});
  // }

  // public getVehicleByVin( vin: string ): Observable<VehicleData>{        
  //   return this._http.get<VehicleData>(`${ this.baseUrl }/api/vehicleByVin/${ vin }`, {headers: this.headers});
  // }

  public getChoiceByVin ( vin: string):Observable<any>{
    return this._http.get(`${ this.baseUrl }/api/apartado/${ vin }`, {headers: this.headers});
  }

  public getRecommendedCarsByVin( vin: string ): Observable<RecommendedCarsData>{
    return this._http.get<RecommendedCarsData>(`${ this.baseUrl }/api/getRecommendedCarsByVin/${ vin }`, {headers: this.headers});
  }

  /**
   * Generate notification for vehicle reserved
   */
  public notificationReserved(notification: UntypedFormGroup): Observable<Notification> {    
    return this._http.post<Notification>(`${ this.baseUrl }/api/notification`, notification);
  }

  /**
   * Ask Information Vehicle
   * @param form FormGroup
   */
  public sendAskInformationLead(form: UntypedFormGroup) {
    return this._http.post(`${ this.baseUrl }/api/askInformationVehicle`, form);
  }


  /**
   * Get Seller User data
   * @param userId number
   */
  public sellerById(userId : number){
    // return this._http.get<UserById>(`${this.baseUrl}/api/sellerById/${userId}`, {headers: this.headers})
  }

}
