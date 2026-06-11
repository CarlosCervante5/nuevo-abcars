import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { dedupeDealershipsForSelect, filterDealershipsByServiceTypes } from '../utils/public-dealerships';
import type { DealershipServiceType } from '../interfaces/admin.interfaces';
import { FormGroup } from '@angular/forms';

//prueba
import { GralResponse, BodiesResponse, BrandsResponse, FullDetailResponse, LinesResponse, ModelsResponse, SearchResponse, VersionsResponse, VehicleUpdateResponse, VehicleStoreResponse, MinMaxResponse } from '@interfaces/vehicle_data.interface';
import { DealerShipResponse } from '@interfaces/admin.interfaces';


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
            relationship_names: ['brand', 'line', 'model', 'body', 'version', 'dealership', 'specification', 'campaigns.promotions', 'images'],
        }

        return this._http.post<FullDetailResponse>(`${ this.baseUrl }/api/vehicles/detail`, data, { headers });

    }

    public getBrands():Observable<BrandsResponse>{
        return this._http.get<BrandsResponse>(`${ this.baseUrl }/api/vehicle_brands`);
    }

    /**
     * Marcas con al menos un vehículo con page_status activo y sin valuación
     * (misma lógica que búsqueda pública de inventario).
     */
    public getBrandsForInventoryFilter(): Observable<BrandsResponse> {
        return this._http.get<BrandsResponse>(`${ this.baseUrl }/api/vehicle_brands/inventory_filter`);
    }

    public getModels(brand: string):Observable<ModelsResponse>{
        return this._http.get<ModelsResponse>(`${ this.baseUrl }/api/line_models/by_brand/${encodeURIComponent(brand)}`);
    }

    public getModelsByBrand(brand: string):Observable<ModelsResponse>{
        return this._http.get<ModelsResponse>(`${ this.baseUrl }/api/line_models/by_brand/${encodeURIComponent(brand)}`);
    }

    /** Line models en inventario público (activos, sin valuación) para el desplegable del home. */
    public getLineModelsByBrandForInventoryFilter(brand: string): Observable<ModelsResponse> {
        return this._http.get<ModelsResponse>(
            `${ this.baseUrl }/api/line_models/inventory_filter_by_brand/${encodeURIComponent(brand)}`
        );
    }

    public getVersions(model: string):Observable<VersionsResponse>{
        return this._http.get<VersionsResponse>(`${ this.baseUrl }/api/model_versions/by_model/${model}`);
    }

    public getBodies():Observable<BodiesResponse>{
        return this._http.get<BodiesResponse>(`${ this.baseUrl }/api/vehicle_bodies`);
    }

    public attachVehicle(ids : string[], vehicle_id : string):Observable<GralResponse>{
       
            let data = 
            {
                'vehicle_uuid': vehicle_id,
                'campaing_uuids' : ids,
            }
        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);

        return this._http.post<VehicleUpdateResponse>(`${ this.baseUrl }/api/campaigns/attach_vehicle`, data, { headers });
        
    }


    public storeVehicle( form: FormGroup):Observable<VehicleStoreResponse>{    
        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);

        return this._http.post<VehicleStoreResponse>(`${ this.baseUrl }/api/vehicles`, form, { headers });
    }


    public updateVehicle( form: FormGroup):Observable<VehicleUpdateResponse>{    
        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);

        return this._http.post<VehicleUpdateResponse>(`${ this.baseUrl }/api/vehicles/update`, form, { headers });
    }

    public markVehicleConsignment(uuid: string): Observable<GralResponse> {
        const user_token = localStorage.getItem('user_token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);

        return this._http.post<GralResponse>(
            `${this.baseUrl}/api/vehicles/mark-consignment`,
            { uuid },
            { headers },
        );
    }
    

    public getVehicles(
        page: number,
        word: string,
        paginate: number,
        relationshipNames: string[],
        statusFilter: 'all' | 'active' | 'inactive' = 'all'
    ): Observable<SearchResponse> {
        
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

        const statusParam =
            statusFilter === 'active'
                ? 'active'
                : statusFilter === 'inactive'
                  ? 'inactive'
                  : 'active,inactive';
        params = params.set('status', statusParam);

        params = params.set('has_images', false);

        return this._http.get<SearchResponse>(`${ this.baseUrl }/api/vehicles/search`, {params} );
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

        // Filtros (nombres alineados con SearchVehiclesRequest / VehicleService PHP)
        if (filters.keyword) {
            params = params.set('keyword', filters.keyword);
        }

        if (filters.brand) {
            params = params.set('brand_names', String(filters.brand));
        }

        if (filters.model) {
            params = params.set('model_names', String(filters.model));
        }

        if (filters.yearFrom != null && filters.yearTo != null) {
            const ys: number[] = [];
            const from = Number(filters.yearFrom);
            const to = Number(filters.yearTo);
            for (let y = Math.min(from, to); y <= Math.max(from, to); y++) {
                ys.push(y);
            }
            if (ys.length > 0) {
                params = params.set('years', ys.join(','));
            }
        } else if (filters.yearFrom != null) {
            params = params.set('years', String(filters.yearFrom));
        } else if (filters.yearTo != null) {
            params = params.set('years', String(filters.yearTo));
        }

        const priceLo = filters.priceFrom != null ? Number(filters.priceFrom) : null;
        const priceHi = filters.priceTo != null ? Number(filters.priceTo) : null;
        if (priceLo != null && !Number.isNaN(priceLo) && priceHi != null && !Number.isNaN(priceHi)) {
            params = params.set('prices', `${priceLo},${priceHi}`);
        } else if (priceHi != null && !Number.isNaN(priceHi) && priceHi > 0) {
            params = params.set('prices', `0,${priceHi}`);
        } else if (priceLo != null && !Number.isNaN(priceLo) && priceLo >= 0) {
            params = params.set('prices', String(priceLo));
        }

        if (filters.transmission) {
            params = params.set('transmission', filters.transmission);
        }

        if (filters.body) {
            params = params.set('body', filters.body);
        }

        if (filters.vehicleTypes && Array.isArray(filters.vehicleTypes) && filters.vehicleTypes.length > 0) {
            params = params.set('vehicle_types', filters.vehicleTypes.join(','));
        }

        // Por defecto el backend (SearchVehiclesRequest) usa has_images=true si no se envía.
        // Pasar false explícitamente cuando se necesiten todos los activos (p. ej. listar ubicaciones).
        if (filters.has_images === false) {
            params = params.set('has_images', '0');
        }

        // Relaciones
        const relationshipNames = ['brand', 'line', 'model', 'body', 'version', 'dealership', 'firstImage', 'images'];
        params = params.set('relationship_names', relationshipNames.toString());

        // Solo vehículos activos
        params = params.set('status', 'active');

        return this._http.get<SearchResponse>(`${ this.baseUrl }/api/vehicles/search`, {params} );
    }

    public getMinMaxPrices():Observable<MinMaxResponse>{
        return this._http.get<MinMaxResponse>(`${ this.baseUrl }/api/vehicles/min_max`);
    }

    public getRandomVehicles(quantity: number = 8):Observable<SearchResponse>{
        const data = {
            relationship_names: ['brand', 'line', 'model', 'body', 'version', 'dealership', 'first_image', 'images'],
            status: ['active']
        };

        return this._http.post<SearchResponse>(`${ this.baseUrl }/api/vehicles/random`, data);
    }

    /**
     * Catálogo de sucursales para formularios públicos (sin token).
     * El alta/edición/baja se hace en admin: /admin/administrator/dealerships
     */
    public searchDealerships(): Observable<DealerShipResponse> {
        const headers = new HttpHeaders()
            .set('content-type', 'application/json')
            .set('X-Requested-With', 'XMLHttpRequest');
        return this._http
            .post<DealerShipResponse>(`${this.baseUrl}/api/dealerships/search`, {}, { headers })
            .pipe(
                map((res) => ({
                    ...res,
                    data: Array.isArray(res.data) ? dedupeDealershipsForSelect(res.data) : res.data,
                }))
            );
    }

    /**
     * Mismo catálogo que searchDealerships, filtrado por tipos de servicio de la sucursal
     * (p. ej. solo venta para financiamiento, solo valuaciones para agendar valuación).
     */
    public searchDealershipsForServiceTypes(
        required: DealershipServiceType | DealershipServiceType[],
    ): Observable<DealerShipResponse> {
        return this.searchDealerships().pipe(
            map((res) => ({
                ...res,
                data: Array.isArray(res.data)
                    ? filterDealershipsByServiceTypes(res.data, required)
                    : res.data,
            })),
        );
    }
}

/**
 * Filtro de tipo para `/api/vehicles/search` (vehicle_types).
 * Autos = car, truck, other; motos = moto. Ambos en true = sin filtro (undefined).
 */
export function resolveVehicleTypesFilter(includeAutoLike: boolean, includeMoto: boolean): string[] | undefined {
    if (includeAutoLike && includeMoto) {
        return undefined;
    }
    if (!includeAutoLike && !includeMoto) {
        return undefined;
    }
    const types: string[] = [];
    if (includeMoto) {
        types.push('moto');
    }
    if (includeAutoLike) {
        types.push('car', 'truck', 'other');
    }
    return types.length ? types : undefined;
}
