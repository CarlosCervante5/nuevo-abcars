/**
 * URL base del backend Laravel para rutas relativas tipo `vehicles/search`.
 * Si `VITE_API_BASE_URL` es solo el host (sin `/api`), se añade `/api/` para evitar 404.
 */
export function getApiBaseUrl(): string {
  const raw = String(import.meta.env.VITE_API_BASE_URL ?? '')
    .trim()
    .replace(/^["']|["']$/g, '');
  const fallback = 'https://nuevo-abcars-sandbox.up.railway.app/api';
  let base = raw || fallback;
  base = base.replace(/\/+$/, '');
  if (!/\/api$/i.test(base)) {
    base = `${base}/api`;
  }
  return `${base}/`;
}

/** Origen sin barra final (p. ej. `…/api` para `/media/fetch-image`). */
export function getApiOrigin(): string {
  return getApiBaseUrl().replace(/\/+$/, '');
}

/** Raíz web del backend si los assets públicos no van bajo `/api`. */
export function getAssetBaseUrl(): string {
  return getApiBaseUrl().replace(/\/api\/?$/, '/');
}
