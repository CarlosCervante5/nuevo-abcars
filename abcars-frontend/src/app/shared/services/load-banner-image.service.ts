import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { GralResponse } from '@interfaces/admin.interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadBannerImageService {

  private url: string = environment.baseUrl;

  constructor(private _http:HttpClient) { }

  public setBannerImage(files: File[]):Observable<GralResponse>{
    const hoy = new Date();
    const dia = hoy.getDate().toString().padStart(2,'0');
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const anio = hoy.getFullYear();
    const todayDate = `${anio}-${mes}-${dia}`;
    const formData: FormData = new FormData();

    formData.append('begin_date', todayDate);
    formData.append('end_date', todayDate);
    formData.append('name', 'Imagen banner principal');
    formData.append('page_status', 'public');
    // formData.append('image', file);
    files.map( (file) => formData.append('image', file));

    let user_token = localStorage.getItem('user_token');
    let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);

    return this._http.post<GralResponse>(this.url+'/api/banner', formData, { headers });
  }

}
