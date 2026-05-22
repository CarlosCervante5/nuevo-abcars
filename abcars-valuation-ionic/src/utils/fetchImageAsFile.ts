import { Capacitor } from '@capacitor/core';
import { Http } from '@capacitor-community/http';
import { getApiOrigin } from '../config/apiBaseUrl';
import { fileToBase64 } from './fileToBase64';

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

function authHeadersForProxy(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
}

function base64ToBlob(base64: string, contentType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType || 'image/jpeg' });
}

async function fetchImageNative(fetchUrl: string, headers: Record<string, string>): Promise<Blob> {
  const res = await Http.request({
    method: 'GET',
    url: fetchUrl,
    headers,
    params: {},
    responseType: 'blob',
    readTimeout: 120000,
    connectTimeout: 60000,
  });

  if (res.status >= 400) {
    throw new Error(`No se pudo descargar la imagen (HTTP ${res.status}).`);
  }

  const ct =
    (res.headers['content-type'] as string) ||
    (res.headers['Content-Type'] as string) ||
    'image/jpeg';

  if (typeof res.data === 'string') {
    return base64ToBlob(res.data, ct);
  }
  if (res.data instanceof Blob) {
    return res.data;
  }
  throw new Error('Respuesta de imagen no válida.');
}

/**
 * Descarga URL remota a File. En app nativa usa HTTP sin CORS; CDN usa proxy Laravel.
 */
export async function fetchImageAsFile(url: string, filename: string): Promise<File> {
  const resolved = normalizeRemoteImageUrl(url);
  if (!resolved) {
    throw new Error('URL de imagen vacía.');
  }
  const useProxy = shouldUseApiImageProxy(resolved);
  const fetchUrl = useProxy ? buildProxyUrl(resolved) : resolved;
  const headers: Record<string, string> = {};
  if (useProxy) {
    Object.assign(headers, authHeadersForProxy());
  }

  let blob: Blob;
  if (Capacitor.isNativePlatform()) {
    blob = await fetchImageNative(fetchUrl, headers);
  } else {
    const res = await fetch(fetchUrl, {
      mode: 'cors',
      credentials: 'omit',
      headers: Object.keys(headers).length ? headers : undefined,
    });
    if (!res.ok) {
      throw new Error(`No se pudo descargar la imagen (HTTP ${res.status}).`);
    }
    blob = await res.blob();
  }

  const type = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  const base = filename.replace(/\.[^/.]+$/, '') || 'imagen';
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `${base}.${ext}`, { type });
}
