export interface Vehicle {
  id?: number;
  uuid?: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: string;
  transmission: string;
  status: string;
  image_url?: string;
  certification?: string;
  name?: string;
  apiData?: any;
} 