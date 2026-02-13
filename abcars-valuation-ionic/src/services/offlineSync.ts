import { valuationService } from './valuationService';
import { offlineQueue } from './offlineQueue';
import type { OfflineQueueItem, OfflineActionType, UploadImagePayload } from './offlineQueue.types';

/** Convierte base64 (data URL: data:image/...;base64,...) a File. */
function base64ToFile(base64: string, fileName: string, mimeType: string): Promise<File> {
  return fetch(base64).then((res) => res.blob()).then((blob) => {
    return new File([blob], fileName, { type: mimeType });
  });
}

/** Convierte File a data URL base64 para guardar en cola. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function processItem(item: OfflineQueueItem): Promise<void> {
  const { type, payload } = item;

  switch (type) {
    case 'upload_image': {
      const p = payload as unknown as UploadImagePayload;
      const file = await base64ToFile(
        p.imageBase64,
        p.fileName || `image_${Date.now()}.jpg`,
        p.mimeType || 'image/jpeg'
      );
      await valuationService.uploadImage(
        p.valuation_uuid,
        p.name,
        file,
        p.group_name || 'checkpoint'
      );
      break;
    }
    case 'update_checkpoint':
      await valuationService.updateCheckpoint(
        payload.valuation_uuid as string,
        payload.checkpoint_uuid as string,
        payload.selected_value as string
      );
      break;
    case 'update_acquisition_checkpoint':
      await valuationService.updateAcquisitionCheckpoint(
        payload.valuation_uuid as string,
        payload.checkpoint_uuid as string,
        payload.selected_value as string
      );
      break;
    case 'update_customer_info':
      await valuationService.updateCustomerInformation(payload as Record<string, unknown>);
      break;
    case 'update_valuation':
      await valuationService.updateValuation({
        valuation_uuid: payload.valuation_uuid as string,
        ...payload,
      } as any);
      break;
    case 'create_bodywork_request':
      const bodyworkPayload = payload as {
        description: string;
        valuation_uuid: string;
        imageBase64: string;
        fileName: string;
        mimeType: string;
      };
      const bodyworkFile = await base64ToFile(
        bodyworkPayload.imageBase64,
        bodyworkPayload.fileName || 'damage.jpg',
        bodyworkPayload.mimeType || 'image/jpeg'
      );
      await valuationService.createBodyworkRequest(
        bodyworkPayload.description,
        bodyworkFile,
        bodyworkPayload.valuation_uuid
      );
      break;
    case 'create_spare_part':
      await valuationService.createSparePart({
        valuation_uuid: payload.valuation_uuid as string,
        name: payload.name as string,
        quantity: payload.quantity as number,
        labor_time: payload.labor_time as number,
      });
      break;
    case 'delete_spare_part':
      await valuationService.deleteSparePart(payload.part_uuid as string);
      break;
    case 'create_customer':
      await valuationService.createCustomer({
        name: payload.name as string,
        last_name: payload.last_name as string,
        email: payload.email as string,
        phone_1: payload.phone_1 as string,
        origin_agency: payload.origin_agency as string | undefined,
      });
      break;
    case 'create_valuation_appointment':
      await valuationService.createValuationAppointment({
        type: payload.type as string,
        customer_uuid: payload.customer_uuid as string,
        brand_name: payload.brand_name as string,
        model_name: payload.model_name as string,
        year: payload.year as number,
        mileage: payload.mileage as number,
        scheduled_date: payload.scheduled_date as string,
        dealership_name: payload.dealership_name as string,
      });
      break;
    case 'create_valuation_with_customer': {
      const { customer, appointment } = payload as {
        customer: { name: string; last_name: string; email: string; phone_1: string; origin_agency?: string };
        appointment: { type: string; brand_name: string; model_name: string; year: number; mileage: number; scheduled_date: string; dealership_name: string };
      };
      const customerRes = await valuationService.createCustomer(customer);
      const customerUuid =
        (customerRes as any)?.data?.profile?.uuid ??
        (customerRes as any)?.data?.user_profile?.uuid;
      if (!customerUuid) throw new Error('No se obtuvo customer_uuid al crear cliente');
      await valuationService.createValuationAppointment({
        ...appointment,
        customer_uuid: customerUuid,
      });
      break;
    }
    default:
      throw new Error(`Unknown offline action type: ${type}`);
  }
}

/** Procesa la cola en orden; elimina cada ítem al enviar correctamente. */
export async function processOfflineQueue(
  onProgress?: (current: number, total: number, item: OfflineQueueItem) => void,
  onError?: (item: OfflineQueueItem, error: unknown) => void
): Promise<{ processed: number; failed: number }> {
  const items = await offlineQueue.getAll();
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    onProgress?.(i + 1, items.length, item);
    try {
      await processItem(item);
      await offlineQueue.remove(item.id);
      processed++;
    } catch (err) {
      failed++;
      onError?.(item, err);
      // Siguiente ítem; el fallido queda en cola para reintentar después
    }
  }

  return { processed, failed };
}
