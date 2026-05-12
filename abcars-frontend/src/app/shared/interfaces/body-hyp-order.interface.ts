export interface BodyHypOrdersListResponse {
  status: number;
  message: string;
  data: BodyHypOrdersPaginator;
}

export interface BodyHypOrdersPaginator {
  current_page: number;
  data: BodyHypOrder[];
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface BodyHypOrder {
  uuid: string;
  title: string | null;
  description: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}
