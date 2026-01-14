export interface Repair {
  uuid: string;
  description: string;
  cost: number;
  labor_hours?: number;
  images?: string[];
  created_at?: string;
}

export interface Part {
  uuid: string;
  name: string;
  cost: number;
  supplier?: string;
  created_at?: string;
}

export interface CreateRepairRequest {
  valuation_uuid: string;
  description: string;
  cost: number;
  labor_hours?: number;
}

export interface UpdateRepairRequest {
  description?: string;
  cost?: number;
  labor_hours?: number;
}

export interface CreatePartRequest {
  valuation_uuid: string;
  name: string;
  cost: number;
  supplier?: string;
}

export interface UpdatePartRequest {
  name?: string;
  cost?: number;
  supplier?: string;
}

export interface RepairListResponse {
  status: number;
  message: string;
  data?: Repair[];
}

export interface PartListResponse {
  status: number;
  message: string;
  data?: Part[];
}

