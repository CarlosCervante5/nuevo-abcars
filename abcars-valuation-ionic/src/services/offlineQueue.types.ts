/**
 * Tipos de acciones que se encolan cuando no hay conexión.
 * Al recuperar conexión se envían al servidor en orden.
 */
export type OfflineActionType =
  | 'upload_image'
  | 'update_checkpoint'
  | 'update_acquisition_checkpoint'
  | 'update_customer_info'
  | 'update_valuation'
  | 'create_bodywork_request'
  | 'create_spare_part'
  | 'delete_spare_part'
  | 'create_customer'
  | 'create_valuation_appointment'
  | 'create_valuation_with_customer';

export interface OfflineQueueItem {
  id: string;
  type: OfflineActionType;
  payload: Record<string, unknown>;
  createdAt: number;
  valuationUuid?: string;
}

/** Payload para upload_image: imagen en base64 para guardar en IndexedDB */
export interface UploadImagePayload {
  valuation_uuid: string;
  name: string;
  group_name: string;
  imageBase64: string;
  mimeType: string;
  fileName: string;
}

export const OFFLINE_DB_NAME = 'abcars_offline_db';
export const OFFLINE_QUEUE_STORE = 'offline_queue';
export const OFFLINE_BLOBS_STORE = 'offline_blobs';
