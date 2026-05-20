import type { PhotoGuideType } from '../components/PhotoTypeSelector';

import frontalIzquierda from '../assets/fotos/frontal-izquierda.svg';
import lateralIzquierda from '../assets/fotos/lateral-izquierda.svg';
import posteriorIzquierda from '../assets/fotos/posterior-izquierda.svg';
import posterior from '../assets/fotos/posterior.svg';
import posteriorDerecha from '../assets/fotos/posterior-derecha.svg';
import lateralDerecha from '../assets/fotos/lateral-derecha.svg';
import frontalDerecha from '../assets/fotos/frontal-derecha.svg';
import frontal from '../assets/fotos/frontal.svg';
import interior from '../assets/fotos/interior.svg';
import asientosDelanteros from '../assets/fotos/asientos-delanteros.svg';
import asientosTraseros from '../assets/fotos/asientos-traseros.svg';
import vistaCabina from '../assets/fotos/vista-cabina.svg';
import vistaConductor from '../assets/fotos/vista-conductor.svg';
import odometro from '../assets/fotos/odometro.svg';
import controles from '../assets/fotos/controles.svg';
import lucesInteriores from '../assets/fotos/luces-internas.svg';
import palancaVelocidades from '../assets/fotos/palanca-velocidades.svg';
import farosDelanteros from '../assets/fotos/faros-delanteros.svg';
import llantas from '../assets/fotos/llantas.svg';
import lucesTraseras from '../assets/fotos/luces-traceras.svg';
import logotipoMarca from '../assets/fotos/logotipo.svg';
import motor from '../assets/fotos/motor.svg';
import logotipoModelo from '../assets/fotos/logotipo-modelo.svg';
import cajuela from '../assets/fotos/cajuela.svg';
import quemacocos from '../assets/fotos/quemacocos.svg';
import llaves from '../assets/fotos/llaves.svg';

/** Ilustraciones vectoriales originales por tipo de foto. */
export const photoGuideAssetByType: Record<PhotoGuideType, string> = {
  frontal_izquierda: frontalIzquierda,
  lateral_izquierda: lateralIzquierda,
  posterior_izquierda: posteriorIzquierda,
  posterior,
  posterior_derecha: posteriorDerecha,
  lateral_derecha: lateralDerecha,
  frontal_derecha: frontalDerecha,
  frontal,
  interior,
  asientos_delanteros: asientosDelanteros,
  asientos_traseros: asientosTraseros,
  vista_cabina: vistaCabina,
  vista_conductor: vistaConductor,
  odometro,
  controles,
  luces_interiores: lucesInteriores,
  palanca_velocidades: palancaVelocidades,
  faros_delanteros: farosDelanteros,
  llantas,
  luces_traseras: lucesTraseras,
  logotipo_marca: logotipoMarca,
  motor,
  logotipo_modelo: logotipoModelo,
  cajuela,
  quemacocos,
  llaves,
};

export const DEFAULT_PHOTO_GUIDE_ASSET = frontal;

export function getPhotoGuideAsset(type: PhotoGuideType | 'car' | undefined): string {
  if (!type || type === 'car') {
    return DEFAULT_PHOTO_GUIDE_ASSET;
  }
  return photoGuideAssetByType[type] ?? DEFAULT_PHOTO_GUIDE_ASSET;
}
