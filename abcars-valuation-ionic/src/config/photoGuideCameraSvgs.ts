import type { PhotoGuideType } from '../components/PhotoTypeSelector';

/** Nombre de archivo (sin .svg) en src/assets/fotos */
const PHOTO_FILE_BY_TYPE: Record<PhotoGuideType, string> = {
  frontal_izquierda: 'frontal-izquierda',
  lateral_izquierda: 'lateral-izquierda',
  posterior_izquierda: 'posterior-izquierda',
  posterior: 'posterior',
  posterior_derecha: 'posterior-derecha',
  lateral_derecha: 'lateral-derecha',
  frontal_derecha: 'frontal-derecha',
  frontal: 'frontal',
  interior: 'interior',
  asientos_delanteros: 'asientos-delanteros',
  asientos_traseros: 'asientos-traseros',
  vista_cabina: 'vista-cabina',
  vista_conductor: 'vista-conductor',
  odometro: 'odometro',
  controles: 'controles',
  luces_interiores: 'luces-internas',
  palanca_velocidades: 'palanca-velocidades',
  faros_delanteros: 'faros-delanteros',
  llantas: 'llantas',
  luces_traseras: 'luces-traceras',
  logotipo_marca: 'logotipo',
  motor: 'motor',
  logotipo_modelo: 'logotipo-modelo',
  cajuela: 'cajuela',
  quemacocos: 'quemacocos',
  llaves: 'llaves',
};

const rawModules = import.meta.glob('../assets/fotos/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const markupByBasename: Record<string, string> = {};

for (const [path, raw] of Object.entries(rawModules)) {
  const base = path.split('/').pop()?.replace(/\.svg$/i, '') ?? '';
  if (base) {
    markupByBasename[base] = prepareSvgForCamera(raw);
  }
}

function prepareSvgForCamera(svg: string): string {
  return svg
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\sclass="cls-\d+"/gi, '')
    .replace(/<svg\b/i, '<svg class="photo-guide-camera-svg"');
}

export function getCameraGuideSvgMarkup(type: PhotoGuideType | 'car'): string {
  const base =
    type === 'car' ? 'frontal' : PHOTO_FILE_BY_TYPE[type];
  return markupByBasename[base] ?? markupByBasename.frontal ?? '';
}
