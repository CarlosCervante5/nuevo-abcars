/**
 * URLs listos para inventario / fichas: JPEG opaco con fondo tipo estudio.
 * `f_auto` puede mantener PNG con canal alpha y el navegador muestra transparencia (rejilla).
 */
const FLATTEN_SEGMENT = 'f_jpg,q_auto,b_rgb:fafbfc';

/** URLs firmadas: alterar la ruta rompe la firma. */
function isCloudinarySignedUpload(url: string): boolean {
  return /\/image\/upload\/s--/i.test(url);
}

function alreadyFlattened(url: string): boolean {
  return (
    url.includes(`/image/upload/${FLATTEN_SEGMENT}/`) ||
    url.includes(`/image/upload/${FLATTEN_SEGMENT},`)
  );
}

/**
 * Inserta transformación Cloudinary para entrega JPG con fondo (#fafbfc).
 * Reemplaza el prefijo antiguo `f_auto,q_auto` usado en listados.
 */
export function optimizeCloudinaryVehicleDeliveryUrl(url: string | null | undefined): string {
  const trimmed = (url ?? '').trim();
  if (!trimmed || !trimmed.startsWith('http')) {
    return trimmed;
  }
  if (isCloudinarySignedUpload(trimmed)) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  if (!lower.includes('res.cloudinary.com') || !lower.includes('/image/upload/')) {
    return trimmed;
  }

  if (alreadyFlattened(trimmed)) {
    return trimmed;
  }

  const legacyAuto = /\/image\/upload\/f_auto,q_auto\//i;
  if (legacyAuto.test(trimmed)) {
    return trimmed.replace(legacyAuto, `/image/upload/${FLATTEN_SEGMENT}/`);
  }

  return trimmed.replace(/(\/image\/upload\/)/i, `$1${FLATTEN_SEGMENT}/`);
}
