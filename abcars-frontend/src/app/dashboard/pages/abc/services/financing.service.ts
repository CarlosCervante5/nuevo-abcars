import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UntypedFormGroup } from '@angular/forms';

// Environments
import { environment } from 'src/environments/environment'; 

// Interfaces
import { Financing, Reference, State, UploadFilesFinancing } from "../interfaces/financing/financing";

@Injectable({
  providedIn: 'root'
})

export class FinancingService {

  private url: string = environment.baseUrl;

  constructor(private _http: HttpClient) { }

  /**
   * Get states
   */
  public getStates(): Observable<State> {
    return this._http.get<State>(`${ this.url }/api/states`);
  }

  /**
   * Create financing
   */
  public createFinancing(form: UntypedFormGroup): Observable<Financing> {
    return this._http.post<Financing>(`${ this.url }/api/financing`, form);
  }

  /**
   * Create financing references
   */
  public createFinancingReferences(reference: UntypedFormGroup): Observable<Reference> {
    return this._http.post<Reference>(`${ this.url }/api/reference`, reference);
  }

  /**
   * Upload Files Financing
   */
  public uploadFilesFinancing(financing_id: number, files: any): Observable<UploadFilesFinancing> {        
    const fileData: FormData = new FormData();
    fileData.append('ine_front', files.ine_front);
    fileData.append('ine_back', files.ine_back);
    fileData.append('address_proof', files.address_proof);
    
    return this._http.post<UploadFilesFinancing>(`${ this.url }/api/financing/files/${ financing_id }`, fileData);    
  }

}