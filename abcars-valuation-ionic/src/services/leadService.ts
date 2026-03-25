import api from './api';

export interface FinancingFormData {
  name: string;
  last_name?: string;
  phone: string;
  email: string;
  city?: string;
  comments?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_price?: number;
  down_payment?: number;
  down_payment_percentage?: number;
  monthly_payment?: number;
  term_months?: number;
  finance_amount?: number;
}

export interface LeadResponse {
  status?: number;
  message?: string;
  success?: boolean;
  data?: unknown;
}

export const leadService = {
  async sendFinancingRequest(data: FinancingFormData): Promise<LeadResponse> {
    const response = await api.post<LeadResponse>('leads/financing', data);
    return response.data;
  },
};
