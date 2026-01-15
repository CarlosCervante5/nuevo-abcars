export interface Checkpoint {
  uuid: string;
  name: string;
  description?: string;
  values: string[];
  value_type: 'select' | 'text' | 'number' | 'boolean';
  section_name: string;
  image_path?: string;
  selected_value?: string;
  sort_id?: number;
  created_at?: string;
}

export interface CheckpointResponse {
  status: number;
  message: string;
  data: Checkpoint[];
}

export interface UpdateCheckpointRequest {
  valuation_uuid: string;
  checkpoint_uuid: string;
  selected_value: string;
}

export interface ChecklistRequest {
  valuation_uuid: string;
  section_name?: string;
}

export const CHECKLIST_SECTIONS = [
  'Mecánica y Eléctrica',
  'Revisión Exterior',
  'Revisión Interior',
  'Certificación de Vehículo',
] as const;

export type ChecklistSection = typeof CHECKLIST_SECTIONS[number];

