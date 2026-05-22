export interface Vehicle {
  uuid: string;
  name: string;
  description?: string;
  vin: string;
  sale_price: number;
  list_price?: number;
  offer_price?: number;
  mileage: number;
  status: string;
  type?: string;
  fuel_type?: string;
  category?: string;
  cylinders?: number;
  engine_displacement_cc?: number | null;
  wet_weight_kg?: number | null;
  interior_color?: string;
  exterior_color?: string;
  transmission?: string;
  drive_train?: string;
  page_status?: string;
  brand?: {
    uuid: string;
    name: string;
  };
  model?: {
    uuid: string;
    name: string;
    year?: number;
  };
  version?: {
    uuid: string;
    name: string;
  };
  body?: {
    uuid: string;
    name: string;
  };
  dealership?: {
    uuid: string;
    name: string;
    location?: string;
  };
  images?: VehicleImage[];
  firstImage?: VehicleImage;
  first_image?: VehicleImage; // Formato del backend (snake_case)
  created_at?: string;
}

export interface VehicleImage {
  uuid: string;
  image_path?: string; // Deprecated, usar service_image_url
  service_image_url: string; // URL completa de la imagen (AWS CloudFront)
  service_public_id?: string;
  sort_id: number;
  created_at?: string;
}

export interface VehicleSearchResponse {
  status: number;
  message: string;
  data: {
    vehicles: Vehicle[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface CreateVehicleRequest {
  // Campos requeridos
  name: string;
  description: string;
  vin: string;
  purchase_date: string;
  sale_price: number;
  list_price: number;
  mileage: number;
  type: 'car' | 'moto' | 'truck' | 'other';
  category: 'new' | 'pre_owned' | 'demo' | 'consignment';
  cylinders: number;
  engine_displacement_cc?: number | null;
  wet_weight_kg?: number | null;
  interior_color: string;
  exterior_color: string;
  transmission: 'manual' | 'automatic' | 'semiautomatic' | 'cvt' | 'triptronic' | 'dual-clutch';
  brand: string;
  model: string;
  version: string;
  body: string;
  dealership_name: string;
  location: string;
  year: number;
  
  // Campos opcionales
  page_status?: 'active' | 'inactive' | 'sale' | 'valuing';
  offer_price?: number;
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'hydrogen' | 'natural_gas';
  drive_train?: string;
  keys_number?: number;
  wheel_locks?: 'yes' | 'no';
  spare_wheel?: 'yes' | 'no';
  hydraulic_jack?: 'yes' | 'no';
  fire_extinguisher?: 'yes' | 'no';
  reflectors?: 'yes' | 'no';
  jumper_cables?: 'yes' | 'no';
  engine_type?: string;
  plates?: string;
  country_of_origin?: string;
  auto_start_stop?: 'yes' | 'no';
  tools?: 'yes' | 'no';
  antenna?: 'yes' | 'no';
  stud_wrench?: 'yes' | 'no';
  security_film?: 'yes' | 'no';
  warranty_policy?: 'yes' | 'no';
  warranty_manual?: 'yes' | 'no';
  intake_engine?: string;
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {
  vehicle_uuid: string;
}

