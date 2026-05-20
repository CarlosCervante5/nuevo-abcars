import type { PhotoGuideType } from '../components/PhotoTypeSelector';
import { getPhotoGuideAsset } from './photoGuideAssets';

export type PhotoGuideCategory = 'exterior' | 'interior' | 'details';

export interface PhotoGuideEntry {
  id: number;
  type: PhotoGuideType;
  title: string;
  category: PhotoGuideCategory;
  imageSrc: string;
}

export const PHOTO_GUIDE_ENTRIES: PhotoGuideEntry[] = [
  { id: 1, type: 'frontal_izquierda', title: 'Frontal Izquierda', category: 'exterior', imageSrc: getPhotoGuideAsset('frontal_izquierda') },
  { id: 2, type: 'lateral_izquierda', title: 'Lateral Izquierda', category: 'exterior', imageSrc: getPhotoGuideAsset('lateral_izquierda') },
  { id: 3, type: 'posterior_izquierda', title: 'Posterior Izquierda', category: 'exterior', imageSrc: getPhotoGuideAsset('posterior_izquierda') },
  { id: 4, type: 'posterior', title: 'Posterior', category: 'exterior', imageSrc: getPhotoGuideAsset('posterior') },
  { id: 5, type: 'posterior_derecha', title: 'Posterior Derecha', category: 'exterior', imageSrc: getPhotoGuideAsset('posterior_derecha') },
  { id: 6, type: 'lateral_derecha', title: 'Lateral Derecha', category: 'exterior', imageSrc: getPhotoGuideAsset('lateral_derecha') },
  { id: 7, type: 'frontal_derecha', title: 'Frontal Derecha', category: 'exterior', imageSrc: getPhotoGuideAsset('frontal_derecha') },
  { id: 8, type: 'frontal', title: 'Frontal', category: 'exterior', imageSrc: getPhotoGuideAsset('frontal') },
  { id: 9, type: 'interior', title: 'Interior', category: 'interior', imageSrc: getPhotoGuideAsset('interior') },
  { id: 10, type: 'asientos_delanteros', title: 'Asientos Delanteros', category: 'interior', imageSrc: getPhotoGuideAsset('asientos_delanteros') },
  { id: 11, type: 'asientos_traseros', title: 'Asientos Traseros', category: 'interior', imageSrc: getPhotoGuideAsset('asientos_traseros') },
  { id: 12, type: 'vista_cabina', title: 'Vista Cabina', category: 'interior', imageSrc: getPhotoGuideAsset('vista_cabina') },
  { id: 13, type: 'vista_conductor', title: 'Vista Conductor', category: 'interior', imageSrc: getPhotoGuideAsset('vista_conductor') },
  { id: 14, type: 'odometro', title: 'Odómetro', category: 'interior', imageSrc: getPhotoGuideAsset('odometro') },
  { id: 15, type: 'controles', title: 'Controles', category: 'interior', imageSrc: getPhotoGuideAsset('controles') },
  { id: 16, type: 'luces_interiores', title: 'Luces Interiores', category: 'details', imageSrc: getPhotoGuideAsset('luces_interiores') },
  { id: 17, type: 'palanca_velocidades', title: 'Palanca de velocidades', category: 'details', imageSrc: getPhotoGuideAsset('palanca_velocidades') },
  { id: 18, type: 'faros_delanteros', title: 'Faros Delanteros', category: 'details', imageSrc: getPhotoGuideAsset('faros_delanteros') },
  { id: 19, type: 'llantas', title: 'Llantas', category: 'details', imageSrc: getPhotoGuideAsset('llantas') },
  { id: 20, type: 'luces_traseras', title: 'Luces traseras', category: 'details', imageSrc: getPhotoGuideAsset('luces_traseras') },
  { id: 21, type: 'logotipo_marca', title: 'Logotipo de Marca', category: 'details', imageSrc: getPhotoGuideAsset('logotipo_marca') },
  { id: 22, type: 'motor', title: 'Motor', category: 'details', imageSrc: getPhotoGuideAsset('motor') },
  { id: 23, type: 'logotipo_modelo', title: 'Logotipo Modelo Versión', category: 'details', imageSrc: getPhotoGuideAsset('logotipo_modelo') },
  { id: 24, type: 'cajuela', title: 'Cajuela', category: 'details', imageSrc: getPhotoGuideAsset('cajuela') },
  { id: 25, type: 'quemacocos', title: 'Quemacocos o techo panorámico', category: 'details', imageSrc: getPhotoGuideAsset('quemacocos') },
  { id: 26, type: 'llaves', title: 'Llaves', category: 'details', imageSrc: getPhotoGuideAsset('llaves') },
];
