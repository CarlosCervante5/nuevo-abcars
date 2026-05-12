import { environment } from '@environments/environment';

/**
 * URLs que el navegador no puede leer en modo CORS (p. ej. CloudFront sin ACAO)
 * y que deben pasar por el proxy del API (misma lista conceptual que el backend).
 */
function shouldUseApiImageProxy(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') {
      return false;
    }
    if (typeof window !== 'undefined' && u.origin === window.location.origin) {
      return false;
    }
    const h = u.hostname.toLowerCase();
    if (h.endsWith('.cloudfront.net')) {
      return true;
    }
    if (h === 'res.cloudinary.com' || h.endsWith('.cloudinary.com')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function buildProxyUrl(remoteUrl: string): string {
  const base = environment.baseUrl.replace(/\/$/, '');
  return `${base}/api/media/fetch-image?url=${encodeURIComponent(remoteUrl)}`;
}

/**
 * Descarga una imagen por URL para enviarla a Gemini u otros procesos.
 * Si la URL es CDN sin CORS (CloudFront, etc.), usa el proxy autenticado del backend.
 */
export async function fetchImageAsFile(url: string, filename: string): Promise<File> {
  const useProxy = shouldUseApiImageProxy(url);
  const fetchUrl = useProxy ? buildProxyUrl(url) : url;
  const headers: Record<string, string> = {};
  if (useProxy && typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('user_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(fetchUrl, {
    mode: 'cors',
    credentials: 'omit',
    headers: Object.keys(headers).length ? headers : undefined,
  });
  if (!res.ok) {
    throw new Error(`No se pudo descargar la imagen (HTTP ${res.status}).`);
  }
  const blob = await res.blob();
  const type = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  const base = filename.replace(/\.[^/.]+$/, '') || 'imagen';
  const ext =
    type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `${base}.${ext}`, { type });
}
