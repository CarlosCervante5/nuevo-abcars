import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Form
import { FormGroup } from '@angular/forms';

// HTTP Client
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Enviroment
import { environment } from '@environments/environment';

// Interfaces
import { ShowProfileResponse, UpdateProfileResponse, RolData, ImageData} from '@interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})

export class AccountService {

  // Global Url
  private url: string = environment.baseUrl;

  constructor(private _http: HttpClient) { }

  public validateRole(expected_role:string) {
  
    let user_token = localStorage.getItem('user_token');
    let stored_role =  localStorage.getItem('role') || '';

    let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);

    let body = {
      stored_role: stored_role,
      expected_role: expected_role
    }

    return this._http.post<RolData>(`${ this.url }/api/auth/validate_role`, body, { headers });

  }

  /**
   * API Get information User 
   */
  public getProfile( uuid: string): Observable<ShowProfileResponse> {    

    let user_token = localStorage.getItem('user_token');
    let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);

    return this._http.get<ShowProfileResponse>(`${ this.url }/api/auth/profile/${ uuid }`, { headers });
  }

  /**
   * API Update customer profile 
   */ 
  public updateProfile(form: FormGroup): Observable<UpdateProfileResponse> {  
    
    let user_token = localStorage.getItem('user_token');
    let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);

    return this._http.post<UpdateProfileResponse>(`${ this.url }/api/auth/update_profile`, form, { headers });

  }

  public updateImageProfile( uuid:string, fileToUploaded: File ): Observable<ImageData>{

    let user_token = localStorage.getItem('user_token');
    let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);

    const form: FormData = new FormData();

    form.append('user_uuid', uuid);
    form.append('image', fileToUploaded);

    return this._http.post<ImageData>(this.url+'/api/auth/update_image_profile', form, { headers });
  
  }
}
