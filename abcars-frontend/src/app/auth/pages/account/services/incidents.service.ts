import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from 'src/environments/environment';

import { IncidentData } from './../interfaces/incidents.interface';
import { ClientData } from './../interfaces/client.interface';
import { VehiclesPurchased } from '../interfaces/vehicles-purchased.interface';
import { ServiceIncident } from './../interfaces/service-incident.interface';
import { VehicleIncident } from './../interfaces/vehicle-incident.interface';

@Injectable({
  providedIn: 'root'
})
export class IncidentsService {
  // Global Url
  private url: string = environment.baseUrl;

  // Headers
  private headers = new HttpHeaders().set('Content-Type', 'application/json').set('X-Requested-With', 'XMLHttpRequest');        

  constructor(
    private _http: HttpClient
  ) { }

  public getClient( user_id: number ): Observable<ClientData>{
    return this._http.get<ClientData>(`${ this.url }/api/getClientByUser/${user_id}`);    
  }

  public getServiceIncidents( client_id:number ): Observable<IncidentData>{
    return this._http.get<IncidentData>(`${ this.url }/api/service_incidentByClientId/${client_id}`);    
  }

  public getVehicleIncidents( client_id:number ): Observable<IncidentData>{
    return this._http.get<IncidentData>(`${ this.url }/api/vehicle_incidentByClientId/${client_id}`);    
  }

  public getVehiclesPurchased( client_id:number ): Observable<VehiclesPurchased>{
    return this._http.get<VehiclesPurchased>(`${ this.url }/api/getVehiclesPurchasedByClient/${client_id}`);
  }

  public setServiceIncident(
    name:string,
    description:string,
    client_id:number,
    service_id:number
  ): Observable<ServiceIncident>{
    let body = {
      "name": name,
      "description": description,
      "status": "progress",
      "client_id": client_id,
      "service_id": service_id
    }    

    return this._http.post<ServiceIncident>(this.url+'/api/service_incident', body, {headers: this.headers});
  }

  public setVehicleIncident(
    name:string,
    description:string,
    client_id:number,
    vehicle_id:number
  ): Observable<VehicleIncident>{
    let body = {
      "name": name,
      "description": description,
      "status": "progress",
      "client_id": client_id,
      "vehicle_id": vehicle_id
    }    

    return this._http.post<VehicleIncident>(this.url+'/api/vehicle_incident', body, {headers: this.headers});
  }

}
