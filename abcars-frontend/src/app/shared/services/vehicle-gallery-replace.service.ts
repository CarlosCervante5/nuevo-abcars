import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FullDetailResponse, ImageOrder } from '@interfaces/vehicle_data.interface';
import { ImagesService } from './images.service';
import { VehicleService } from './vehicle.service';

export type GalleryImageRow = Pick<
  ImageOrder,
  'id' | 'sort_id' | 'path' | 'path_public' | 'external_website'
>;

function mapApiImagesToGalleryRows(images: unknown[]): GalleryImageRow[] {
  const rows: GalleryImageRow[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i] as Record<string, unknown>;
    const uuidVal = img['uuid'];
    const id = typeof uuidVal === 'string' ? uuidVal : String(uuidVal ?? '');
    rows.push({
      id,
      sort_id: String(img['sort_id'] ?? i + 1),
      path: String(img['service_image_url'] ?? img['path'] ?? ''),
      path_public: String(img['service_public_id'] ?? ''),
      external_website: (img['external_website'] as string) ?? 'no',
    });
  }
  return rows;
}

/**
 * Reemplazo de una imagen de galería (borrar + subir nueva + restaurar posición en la lista).
 */
@Injectable({ providedIn: 'root' })
export class VehicleGalleryReplaceService {
  constructor(
    private readonly _imagesService: ImagesService,
    private readonly _vehicleService: VehicleService,
  ) {}

  /**
   * @param idsSnapshotBeforeDelete UUIDs de todas las imágenes **antes** de borrar (incluye la que se sustituye).
   */
  replaceAtIndex(
    vehicleUuid: string,
    oldImageUuid: string,
    slotIndex: number,
    file: File,
    idsSnapshotBeforeDelete: Set<string>,
  ): Observable<FullDetailResponse> {
    return this._imagesService.deleteImage(oldImageUuid).pipe(
      switchMap(() => this._imagesService.setImage(vehicleUuid, [file])),
      switchMap(() => this._vehicleService.getVehicle(vehicleUuid)),
      switchMap((res) => {
        const rows = mapApiImagesToGalleryRows(res.data.images as unknown[]);
        const added = rows.find((r) => !idsSnapshotBeforeDelete.has(r.id));
        if (!added || slotIndex < 0 || slotIndex >= rows.length) {
          return of(res);
        }
        const withoutNew = rows.filter((r) => r.id !== added.id);
        const reordered: GalleryImageRow[] = [
          ...withoutNew.slice(0, slotIndex),
          added,
          ...withoutNew.slice(slotIndex),
        ];
        const imageOrder: ImageOrder[] = reordered.map((r) => ({
          id: r.id,
          sort_id: r.sort_id,
          path: r.path,
          path_public: r.path_public,
          external_website: r.external_website,
        }));
        return this._imagesService
          .changeOrder(imageOrder)
          .pipe(switchMap(() => this._vehicleService.getVehicle(vehicleUuid)));
      }),
    );
  }
}
