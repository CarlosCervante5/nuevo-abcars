import { getApiOrigin } from '../config/apiBaseUrl';

/** URLs scheme-relative (`//host/path`) → https */
function normalizeRemoteImageUrl(url: string): string {
  const t = url.trim();
  if (!t) return t;
  if (t.startsWith('//')) return `https:${t}`;
  return t;
}

function isIntelimotorS3ImageHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'intelimotor.s3.amazonaws.com') return true;
  return /^intelimotor\.s3\.[^.]+\.amazonaws\.com$/i.test(h);
}

function shouldUseApiImageProxy(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    if (typeof window !== 'undefined' && u.origin === window.location.origin) {
      return false;
    }
    const h = u.hostname.toLowerCase();
    if (h.endsWith('.cloudfront.net')) return true;
    if (h === 'res.cloudinary.com' || h.endsWith('.cloudinary.com')) return true;
    if (isIntelimotorS3ImageHost(h)) return true;
    return false;
  } catch {
    return false;
  }
}

function buildProxyUrl(remoteUrl: string): string {
  return `${getApiOrigin()}/media/fetch-image?url=${encodeURIComponent(remoteUrl)}`;
}

/**
 * Descarga URL remota a File. CDN sin CORS usa proxy Laravel (/api/media/fetch-image) con Bearer auth_token.
 */
export async function fetchImageAsFile(url: string, filename: string): Promise<File> {
  const resolved = normalizeRemoteImageUrl(url);
  if (!resolved) {
    throw new Error('URL de imagen vacía.');
  }
  const useProxy = shouldUseApiImageProxy(resolved);
  const fetchUrl = useProxy ? buildProxyUrl(resolved) : resolved;
  const headers: Record<string, string> = {};
  if (useProxy && typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
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
  const type =
    blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  const base = filename.replace(/\.[^/.]+$/, '') || 'imagen';
  const ext =
    type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `${base}.${ext}`, { type });
}
