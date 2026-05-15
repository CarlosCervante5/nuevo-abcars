import api from './api';
import { ApiResponse } from '../models';
import { Vehicle, VehicleSearchResponse, CreateVehicleRequest, UpdateVehicleRequest } from '../models/Vehicle';

export const vehicleService = {
  // Buscar vehículos
  async searchVehicles(params: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    brand?: string;
    model?: string;
    body_names?: string;
    min_price?: number;
    max_price?: number;
    /** Misma convención que el panel Angular (`has_images=false` en inventario). Por defecto no se envía → backend usa `true`. */
    has_images?: boolean;
  }): Promise<VehicleSearchResponse> {
    const queryParams = new URLSearchParams();
    
    // El backend usa 'paginate' en lugar de 'per_page'
    if (params.per_page) queryParams.append('paginate', params.per_page.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    // El backend usa 'keyword' en lugar de 'search'
    if (params.search) queryParams.append('keyword', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.brand) queryParams.append('brand_names', params.brand);
    if (params.model) queryParams.append('model_names', params.model);
    if (params.body_names) queryParams.append('body_names', params.body_names);
    if (params.min_price || params.max_price) {
      const prices = [];
      if (params.min_price) prices.push(params.min_price);
      if (params.max_price) prices.push(params.max_price);
      queryParams.append('prices', prices.join(','));
    }

    if (params.has_images !== undefined) {
      queryParams.append('has_images', params.has_images ? '1' : '0');
    }

    // Laravel SearchVehiclesRequest usa `relationship_names` (CSV). Sin esto el backend aplica su lista por defecto.
    queryParams.append('relationship_names', 'firstImage,brand,model,version');

    console.log('Vehicle search request:', `vehicles/search?${queryParams.toString()}`);
    const response = await api.get<any>(
      `vehicles/search?${queryParams.toString()}`
    );
    
    console.log('Vehicle search raw response:', JSON.stringify(response.data, null, 2));
    
    // El backend retorna: { status: 200, message: "...", data: { current_page, data: [...], total, per_page, last_page } }
    // axios ya desenvuelve response.data, así que response.data es el JSON completo
    const apiResponse = response.data;
    
    if (apiResponse && Number(apiResponse.status) === 200 && apiResponse.data != null) {
      const paginatedData = apiResponse.data;
      
      // Mapear vehículos para convertir first_image (snake_case) a firstImage (camelCase)
      const vehicles = Array.isArray(paginatedData.data) 
        ? paginatedData.data.map((vehicle: any) => ({
            ...vehicle,
            firstImage: vehicle.first_image || vehicle.firstImage, // Soporta ambos formatos
          }))
        : [];
      
      // La estructura de Laravel paginate es: { data: [...], current_page, last_page, per_page, total }
      return {
        status: apiResponse.status,
        message: apiResponse.message || 'Vehículos encontrados',
        data: {
          vehicles: vehicles,
          total: paginatedData.total || 0,
          per_page: paginatedData.per_page || params.per_page || 20,
          current_page: paginatedData.current_page || params.page || 1,
          last_page: paginatedData.last_page || 1,
        }
      };
    }
    
    // Respuesta por defecto si hay algún error
    console.warn('Unexpected response structure:', apiResponse);
    return {
      status: apiResponse?.status || 200,
      message: apiResponse?.message || 'Error al obtener vehículos',
      data: {
        vehicles: [],
        total: 0,
        per_page: params.per_page || 20,
        current_page: params.page || 1,
        last_page: 1,
      }
    };
  },

  // Obtener detalle de vehículo
  async getVehicleDetail(vehicleUuid: string): Promise<ApiResponse<Vehicle>> {
    const response = await api.post<ApiResponse<Vehicle>>('vehicles/detail', {
      uuid: vehicleUuid, // El backend espera 'uuid', no 'vehicle_uuid'
      relationship_names: ['brand', 'line', 'model', 'version', 'body', 'dealership', 'specification', 'images', 'firstImage', 'campaigns.promotions']
    });
    
    // Mapear first_image a firstImage y asegurar que images esté disponible
    if (response.data && response.data.data) {
      const vehicle = response.data.data;
      
      // Mapear first_image a firstImage
      if ((vehicle as any).first_image && !vehicle.firstImage) {
        vehicle.firstImage = (vehicle as any).first_image;
      }
      
      // Asegurar que images esté disponible (soporta diferentes formatos del backend)
      if (!vehicle.images || vehicle.images.length === 0) {
        vehicle.images = (vehicle as any).images_data || (vehicle as any).images || [];
      }
      
      // Log para debugging
      console.log('Vehicle detail - images:', vehicle.images);
      console.log('Vehicle detail - images count:', vehicle.images?.length || 0);
    }
    
    return response.data;
  },

  // Crear vehículo
  async createVehicle(data: CreateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    const response = await api.post<ApiResponse<Vehicle>>('vehicles/create', data);
    return response.data;
  },

  // Actualizar vehículo
  async updateVehicle(data: UpdateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    const response = await api.post<ApiResponse<Vehicle>>('vehicles/update', data);
    return response.data;
  },

  // Eliminar vehículo
  async deleteVehicle(vehicleUuid: string): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('vehicles/delete', {
      vehicle_uuid: vehicleUuid
    });
    return response.data;
  },

  // Cambiar estado del vehículo
  async updateVehicleStatus(vehicleUuid: string, status: string): Promise<ApiResponse<Vehicle>> {
    const response = await api.post<ApiResponse<Vehicle>>('vehicles/status', {
      vehicle_uuid: vehicleUuid,
      status: status
    });
    return response.data;
  },

  // Subir imágenes del vehículo
  async uploadVehicleImages(vehicleUuid: string, images: File[]): Promise<ApiResponse<void>> {
    const formData = new FormData();
    formData.append('vehicle_uuid', vehicleUuid);
    images.forEach((file) => {
      formData.append('images[]', file);
    });

    const response = await api.post<ApiResponse<void>>('vehicle_images', formData);
    return response.data;
  },

  /**
   * Sustituye una foto en un índice concreto (borrar + subir nueva + restaurar orden).
   * Misma idea que VehicleGalleryReplaceService en el panel web.
   */
  async replaceGalleryImageAtIndex(
    vehicleUuid: string,
    oldImageUuid: string,
    slotIndex: number,
    file: File,
  ): Promise<ApiResponse<Vehicle>> {
    const before = await this.getVehicleDetail(vehicleUuid);
    if (before.status !== 200 || !before.data) {
      throw new Error('No se pudo cargar el vehículo');
    }
    const imgsBefore = before.data.images || [];
    const idsSnapshot = new Set(imgsBefore.map((img: { uuid: string }) => img.uuid));

    await this.deleteVehicleImage(oldImageUuid);
    await this.uploadVehicleImages(vehicleUuid, [file]);

    const after = await this.getVehicleDetail(vehicleUuid);
    if (after.status !== 200 || !after.data) {
      throw new Error('No se pudo recargar el vehículo tras subir');
    }
    const rows = after.data.images || [];
    const added = rows.find((r: { uuid: string }) => !idsSnapshot.has(r.uuid));
    if (!added || slotIndex < 0 || slotIndex >= rows.length) {
      return after;
    }
    const withoutNew = rows.filter((r: { uuid: string }) => r.uuid !== added.uuid);
    const reordered = [
      ...withoutNew.slice(0, slotIndex),
      added,
      ...withoutNew.slice(slotIndex),
    ];
    const imageOrder = reordered.map((r: { uuid: string }, i: number) => ({
      uuid: r.uuid,
      sort_id: i + 1,
    }));
    await this.updateImageOrder(vehicleUuid, imageOrder);
    return await this.getVehicleDetail(vehicleUuid);
  },

  // Actualizar orden de imágenes
  async updateImageOrder(vehicleUuid: string, imageOrder: { uuid: string; sort_id: number }[]): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('vehicle_images/sort_update', {
      image_order: imageOrder
    });
    return response.data;
  },

  // Eliminar imagen
  async deleteVehicleImage(imageUuid: string): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('vehicle_images/delete', {
      uuid: imageUuid
    });
    return response.data;
  },
};

