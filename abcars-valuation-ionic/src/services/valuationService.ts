import api from './api';
import {
  Valuation,
  ValuationListResponse,
  ApiResponse,
  CheckpointResponse,
  ChecklistRequest,
  UpdateCheckpointRequest,
  RepairListResponse,
  PartListResponse,
  CreateRepairRequest,
  UpdateRepairRequest,
  CreatePartRequest,
  UpdatePartRequest,
  UpdateValuationRequest,
  CreateSparePartRequest,
  SparePartItem,
} from '../models';

export const valuationService = {
  // Autenticación
  async login(email: string, password: string) {
    const requestData = {
      email: email.trim(),
      password: password,
    };
    try {
      const response = await api.post<ApiResponse<{ token: string; user: any; role: string; profile: any }>>('auth/login', requestData);
      // axios ya desenvuelve la respuesta HTTP, response.data es el JSON del backend
      // Backend retorna: { status: 200, message: "...", data: { token: "...", user: {...} } }
      return response.data;
    } catch (error: any) {
      // Si hay error (401, etc), axios lanza excepción pero podemos acceder a response.data
      if (error.response?.data) {
        // Retornar la estructura de error del backend
        return error.response.data;
      }
      throw error;
    }
  },

  // Valuaciones
  async getValuations(status?: string, page: number = 1, paginate: number = 20) {
    const response = await api.get<ValuationListResponse>('valuations/search', {
      params: { status, page, paginate },
    });
    return response.data;
  },

  async getValuationDetail(uuid: string) {
    const response = await api.post<ApiResponse<Valuation>>('valuations/detail', {
      valuation_uuid: uuid,
      relationship_names: [
        'vehicle.brand',
        'vehicle.model',
        'vehicle.version',
        'vehicle.body',
        'vehicle.specification',
        'dealership',
        'appointment',
        'appointment.customer',
        'appointment.vehicle',
        'technician.userProfile',
        'checkpoints',
        'repairs',
        'spareParts',
        'spareParts.partSupplierOriginal',
        'seller.userProfile',
      ],
    });
    return response.data;
  },

  // Checklist de Valuación
  async getChecklist(valuationUuid: string, sectionName?: string) {
    const request: ChecklistRequest = {
      valuation_uuid: valuationUuid,
      section_name: sectionName,
    };
    const response = await api.post<CheckpointResponse>('valuations/checklist', request);
    return response.data;
  },

  async updateCustomerInformation(request: Record<string, any>) {
    const response = await api.post<ApiResponse<void>>('valuations/update_vehicle', request);
    return response.data;
  },

  async getTechnicians() {
    const response = await api.post<ApiResponse<{ users: { uuid: string; user_profile: { name: string; last_name: string } }[] }>>(
      'users/by_role',
      { role_name: 'technician' }
    );
    return response.data;
  },

  async getSellers() {
    const response = await api.post<ApiResponse<{ users: { uuid: string; user_profile: { name: string; last_name: string } }[] }>>(
      'users/by_role',
      { role_name: 'seller' }
    );
    return response.data;
  },

  async updateCheckpoint(
    valuationUuid: string,
    checkpointUuid: string,
    selectedValue: string
  ) {
    const request: UpdateCheckpointRequest = {
      valuation_uuid: valuationUuid,
      checkpoint_uuid: checkpointUuid,
      selected_value: selectedValue,
    };
    const response = await api.post<ApiResponse<void>>('valuations/attatch', request);
    return response.data;
  },

  // Checklist de Adquisición
  async getAcquisitionChecklist(valuationUuid: string, sectionName?: string) {
    const request: ChecklistRequest = {
      valuation_uuid: valuationUuid,
      section_name: sectionName,
    };
    const response = await api.post<CheckpointResponse>('acquisitions/checklist', request);
    return response.data;
  },

  async updateAcquisitionCheckpoint(
    valuationUuid: string,
    checkpointUuid: string,
    selectedValue: string
  ) {
    const request: UpdateCheckpointRequest = {
      valuation_uuid: valuationUuid,
      checkpoint_uuid: checkpointUuid,
      selected_value: selectedValue,
    };
    const response = await api.post<ApiResponse<void>>('acquisitions/attatch', request);
    return response.data;
  },

  // Reparaciones
  async getRepairs(valuationUuid: string) {
    const detail = await this.getValuationDetail(valuationUuid);
    return {
      status: detail.status,
      message: detail.message,
      data: detail.data?.repairs ?? [],
    };
  },

  async createRepair(request: CreateRepairRequest) {
    const response = await api.post<ApiResponse<void>>('valuations/repairs', request);
    return response.data;
  },

  async updateRepair(repairUuid: string, request: UpdateRepairRequest) {
    const response = await api.put<ApiResponse<void>>(
      `valuations/repairs/${repairUuid}`,
      request
    );
    return response.data;
  },

  // Refacciones
  async getParts(valuationUuid: string) {
    const detail = await this.getValuationDetail(valuationUuid);
    const spareParts =
      detail.data?.spareParts ?? detail.data?.spare_parts ?? [];
    return {
      status: detail.status,
      message: detail.message,
      data: spareParts,
    };
  },

  async createPart(request: CreatePartRequest) {
    const response = await api.post<ApiResponse<void>>('valuations/parts', request);
    return response.data;
  },

  async updatePart(partUuid: string, request: UpdatePartRequest) {
    const response = await api.put<ApiResponse<void>>(`valuations/parts/${partUuid}`, request);
    return response.data;
  },

  // Solicitud HyP (carrocería y pintura)
  async createBodyworkRequest(description: string, imageFile: File, valuationUuid: string) {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('image', imageFile);
    formData.append('valuation_uuid', valuationUuid);
    const response = await api.post<ApiResponse<void>>('bodyworks', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Refacciones (solicitud y listado)
  async createSparePart(request: CreateSparePartRequest) {
    const response = await api.post<ApiResponse<void>>('spare_parts', request);
    return response.data;
  },

  async deleteSparePart(partUuid: string) {
    const response = await api.post<ApiResponse<void>>('spare_parts/delete', {
      part_uuid: partUuid,
    });
    return response.data;
  },

  // Imágenes
  async uploadImage(
    valuationUuid: string, 
    imageName: string, 
    imageFile: File,
    groupName: string = 'checkpoint'
  ) {
    const formData = new FormData();
    formData.append('valuation_uuid', valuationUuid);
    formData.append('name', imageName);
    formData.append('group_name', groupName);
    formData.append('images[]', imageFile);

    const response = await api.post<ApiResponse<void>>('valuations/update_images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Buscar imágenes de valuación
  async searchImages(valuationUuid: string, groupName: string) {
    const response = await api.post<ApiResponse<any[]>>('valuations/search_images', {
      valuation_uuid: valuationUuid,
      group_name: groupName,
    });
    return response.data;
  },

  // Descargar PDF de valuación
  async downloadValuationPdf(valuationUuid: string) {
    const response = await api.get('valuations/download_pdf', {
      params: { valuation_uuid: valuationUuid },
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  // Actualizar valuación
  async updateValuation(request: UpdateValuationRequest) {
    const response = await api.post<ApiResponse<void>>('valuations/update', request);
    return response.data;
  },

  // Buscar clientes
  async searchCustomers(keyword: string, paginate: number = 20) {
    const response = await api.get<ApiResponse<any>>('riders/search_customers', {
      params: { keyword, paginate },
    });
    return response.data;
  },

  // Marcas y modelos para citas de valuación
  async getVehicleBrands() {
    const response = await api.get<{ status: number; message: string; data: { vehicle_brands: { name: string }[] } }>('vehicle_brands');
    return response.data;
  },

  async getModelsByBrand(brand: string) {
    const response = await api.get<{ status: number; message: string; data: { line_models: { name: string }[] } }>(
      `line_models/by_brand/${encodeURIComponent(brand)}`
    );
    return response.data;
  },

  // Crear cliente internamente
  async createCustomer(request: {
    name: string;
    last_name: string;
    email: string;
    phone_1: string;
    origin_agency?: string;
  }) {
    const response = await api.post<ApiResponse<any>>('auth/iternally_register', request);
    return response.data;
  },

  // Crear valuación (appointment + valuation)
  async createValuationAppointment(request: {
    type: string;
    customer_uuid: string;
    brand_name: string;
    model_name: string;
    year: number;
    mileage: number;
    scheduled_date: string;
    dealership_name: string;
  }) {
    const response = await api.post<ApiResponse<void>>('appointment/valuation_appointment', request);
    return response.data;
  },
};

