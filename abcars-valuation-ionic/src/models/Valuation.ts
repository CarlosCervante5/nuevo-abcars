import { Repair, SparePartItem } from './Repair';

export interface Valuation {
  uuid: string;
  book_trade_in_offer?: number;
  book_sale_price?: number;
  intellimotors_trade_in_offer?: number;
  intellimotors_sale_price?: number;
  labor_cost?: number;
  spare_parts_cost?: number;
  body_work_painting_cost?: number;
  estimated_total?: number;
  trade_in_final?: number;
  final_offer?: number;
  status: string;
  status_repairs: string;
  status_parts: string;
  status_acquisition: string;
  comments?: string;
  vehicle?: Vehicle;
  dealership?: Dealership;
  appointment?: Appointment;
  technician?: {
    uuid: string;
    user_profile?: {
      name: string;
      last_name: string;
    };
  };
  repairs?: Repair[];
  spareParts?: SparePartItem[];
  spare_parts?: SparePartItem[];
  created_at: string;
}

export interface Vehicle {
  uuid: string;
  name?: string;
  description?: string;
  vin?: string;
  sale_price?: number;
  list_price?: number;
  mileage?: number;
  brand?: Brand;
  model?: Model;
  version?: { name?: string } | string;
  body?: { name?: string } | string;
  year?: number;
  specification?: VehicleSpecification;
  country_of_origin?: string;
  transmission?: string;
  intake_engine?: string;
  auto_start_stop?: string;
  exterior_color?: string;
  plates?: string;
  cylinders?: number | string;
  engine_type?: string;
}

export interface Brand {
  name: string;
  image_path?: string;
}

export interface Model {
  name: string;
  year?: number;
}

export interface VehicleSpecification {
  keys_number?: number;
  wheel_locks?: string;
  spare_wheel?: string;
  hydraulic_jack?: string;
  fire_extinguisher?: string;
  reflectors?: string;
  jumper_cables?: string;
  engine_type?: string;
  plates?: string;
  country_of_origin?: string;
  auto_start_stop?: string;
  warranty_policy?: string;
  warranty_manual?: string;
  intake_engine?: string;
  exterior_color?: string;
}

export interface Dealership {
  name: string;
  location?: string;
  description?: string;
}

export interface Appointment {
  uuid: string;
  customer?: Customer;
  vehicle?: AppointmentVehicle;
  preferred_date?: string;
  preferred_time?: string;
  scheduled_date?: string;
}

export interface Customer {
  name?: string;
  last_name?: string;
  phone?: string;
  phone_1?: string;
  email?: string;
  full_name?: string;
}

export interface AppointmentVehicle {
  model_name?: string;
  brand_name?: string;
  year?: number;
  vin?: string;
  mileage?: number;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data?: T;
}

export interface ValuationListResponse {
  status: number;
  message: string;
  data?: {
    current_page: number;
    data: Valuation[];
    total: number;
  };
}

