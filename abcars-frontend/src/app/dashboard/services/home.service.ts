import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// Interfaces
import { RandomVehiclesData } from '../interfaces/random_vehicles.interface';

@Injectable({
  providedIn: 'root'
})

export class HomeService {
  private baseUrl:string = environment.baseUrl;

  constructor(private _http:HttpClient) { }

  public getVehicles(): Observable<RandomVehiclesData>{
    return this._http.get<RandomVehiclesData>(`${ this.baseUrl }/api/getRandomVehicles`);
  }

}