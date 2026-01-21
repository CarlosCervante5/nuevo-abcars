export * from './Valuation';
export * from './Checkpoint';
export * from './Repair';

export interface UpdateValuationRequest {
  valuation_uuid: string;
  status?: string;
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
  comments?: string;
}

