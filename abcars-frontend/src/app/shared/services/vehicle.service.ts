import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { FormGroup } from '@angular/forms';

//prueba
import { GralResponse, BodiesResponse, BrandsResponse, FullDetailResponse, LinesResponse, ModelsResponse, SearchResponse, VersionsResponse, VehicleUpdateResponse, VehicleStoreResponse, MinMaxResponse } from '@interfaces/vehicle_data.interface';


@Injectable({
    providedIn: 'root'
})
export class VehicleService {

baseUrl = environment.baseUrl;

constructor(
    private _http: HttpClient
) { }

    public getVehicle( uuid:string ):Observable<FullDetailResponse>{

        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);

        let data = { 
            uuid: uuid,
            relationship_names: ['brand', 'line', 'model', 'body', 'version', 'dealership', 'campaigns.promotions', 'images'],
        }

        return this._http.post<FullDetailResponse>(`${ this.baseUrl }/vehicles/detail`, data, { headers });

    }

    public getBrands():Observable<BrandsResponse>{
        return this._http.get<BrandsResponse>(`${ this.baseUrl }/vehicle_brands`);
    }

    public getModels(brand: string):Observable<ModelsResponse>{
        return this._http.get<ModelsResponse>(`${ this.baseUrl }/line_models/by_brand/${brand}`);
    }

    public getModelsByBrand(brand: string):Observable<ModelsResponse>{
        return this._http.get<ModelsResponse>(`${ this.baseUrl }/line_models/by_brand/${brand}`);
    }

    public getVersions(model: string):Observable<VersionsResponse>{
        return this._http.get<VersionsResponse>(`${ this.baseUrl }/model_versions/by_model/${model}`);
    }

    public getBodies():Observable<BodiesResponse>{
        return this._http.get<BodiesResponse>(`${ this.baseUrl }/vehicle_bodies`);
    }

    public attachVehicle(ids : string[], vehicle_id : string):Observable<GralResponse>{
       
            let data = 
            {
                'vehicle_uuid': vehicle_id,
                'campaing_uuids' : ids,
            }
        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);

        return this._http.post<VehicleUpdateResponse>(`${ this.baseUrl }/campaigns/attach_vehicle`, data, { headers });
        
    }


    public storeVehicle( form: FormGroup):Observable<VehicleStoreResponse>{    
        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);

        return this._http.post<VehicleStoreResponse>(`${ this.baseUrl }/vehicles`, form, { headers });
    }


    public updateVehicle( form: FormGroup):Observable<VehicleUpdateResponse>{    
        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);

        return this._http.post<VehicleUpdateResponse>(`${ this.baseUrl }/vehicles/update`, form, { headers });
    }
    

    public getVehicles( page:number, word:string, paginate: number, relationshipNames: string[]):Observable<SearchResponse>{
        
        let params = new HttpParams(); 

        if (word) {
            params = params.set('keyword', word);
        }

        if (page) {
            params = params.set('page', page.toString());
        }

        if(paginate) {
            params = params.set('paginate', paginate.toString());
        }

        if (relationshipNames) {
          params = params.set('relationship_names', relationshipNames.toString());
        }

        params = params.set('status', 'active,inactive');

        params = params.set('has_images', false);

        return this._http.get<SearchResponse>(`${ this.baseUrl }/vehicles/search`, {params} );
    }

    public searchVehicles(filters: any = {}, page: number = 1, paginate: number = 12):Observable<SearchResponse>{
        let params = new HttpParams(); 

        // Paginación
        if (page) {
            params = params.set('page', page.toString());
        }

        if(paginate) {
            params = params.set('paginate', paginate.toString());
        }

        // Filtros
        if (filters.keyword) {
            params = params.set('keyword', filters.keyword);
        }

        if (filters.brand) {
            params = params.set('brand', filters.brand);
        }

        if (filters.model) {
            params = params.set('model', filters.model);
        }

        if (filters.yearFrom) {
            params = params.set('year_from', filters.yearFrom.toString());
        }

        if (filters.yearTo) {
            params = params.set('year_to', filters.yearTo.toString());
        }

        if (filters.priceFrom) {
            params = params.set('price_from', filters.priceFrom.toString());
        }

        if (filters.priceTo) {
            params = params.set('price_to', filters.priceTo.toString());
        }

        if (filters.transmission) {
            params = params.set('transmission', filters.transmission);
        }

        if (filters.body) {
            params = params.set('body', filters.body);
        }

        if (filters.type) {
            params = params.set('type', filters.type);
        }

        // Relaciones
        const relationshipNames = ['brand', 'line', 'model', 'body', 'version', 'dealership', 'firstImage', 'images'];
        params = params.set('relationship_names', relationshipNames.toString());

        // Solo vehículos activos
        params = params.set('status', 'active');

        return this._http.get<SearchResponse>(`${ this.baseUrl }/vehicles/search`, {params} );
    }

    public getMinMaxPrices():Observable<MinMaxResponse>{
        return this._http.get<MinMaxResponse>(`${ this.baseUrl }/vehicles/min_max`);
    }

    public getRandomVehicles(quantity: number = 8):Observable<SearchResponse>{
        const data = {
            relationship_names: ['brand', 'line', 'model', 'body', 'version', 'dealership', 'first_image', 'images'],
            status: ['active']
        };

        return this._http.post<SearchResponse>(`${ this.baseUrl }/vehicles/random`, data);
    }
}
