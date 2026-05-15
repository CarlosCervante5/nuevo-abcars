import { Capacitor } from '@capacitor/core';
import { Http } from '@capacitor-community/http';
import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import xhrAdapter from 'axios/lib/adapters/xhr.js';

function headersToRecord(config: InternalAxiosRequestConfig): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = config.headers;
  if (!raw) return out;
  const flat =
    typeof (raw as { toJSON?: () => Record<string, unknown> }).toJSON === 'function'
      ? (raw as { toJSON: () => Record<string, unknown> }).toJSON()
      : (raw as Record<string, unknown>);
  for (const [k, v] of Object.entries(flat)) {
    if (v == null || v === '') continue;
    if (typeof v === 'object') continue;
    out[k] = String(v);
  }
  return out;
}

function base64ToBlob(base64: string, contentType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType || 'application/octet-stream' });
}

/**
 * Peticiones HTTP nativas (sin CORS). En Android el WebView usa Origin https://localhost
 * y el backend a veces no devuelve ACAO; Axios falla con «Network Error».
 */
export const capacitorHttpAdapter: AxiosAdapter = async (config) => {
  const method = (config.method || 'get').toUpperCase();
  const url = axios.getUri(config);
  const headers = headersToRecord(config);

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    return xhrAdapter(config);
  }

  const data = config.data;
  if (
    data !== undefined &&
    data !== null &&
    typeof data === 'object' &&
    !(data instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(data) &&
    typeof data !== 'string'
  ) {
    const ct = (headers['Content-Type'] || headers['content-type'] || '').toLowerCase();
    if (!ct) {
      headers['Content-Type'] = 'application/json';
    }
  }

  const wantsBlob = config.responseType === 'blob' || config.responseType === 'arraybuffer';
  const httpResponseType = wantsBlob ? 'blob' : 'json';

  // Android HttpRequestHandler.request() hace params.keys() sin null-check: sin `params` revienta toda petición (p. ej. GET con query en la URL).
  const res = await Http.request({
    method,
    url,
    headers,
    data,
    params: {},
    connectTimeout: config.timeout,
    readTimeout: config.timeout,
    responseType: httpResponseType,
    shouldEncodeUrlParams: true,
  });

  let payload: unknown = res.data;
  if (typeof payload === 'string') {
    const t = payload.trim();
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        payload = JSON.parse(t) as unknown;
      } catch {
        /* dejar como string */
      }
    }
  }
  if (config.responseType === 'blob' && typeof payload === 'string') {
    const ct =
      (res.headers['content-type'] as string) ||
      (res.headers['Content-Type'] as string) ||
      'application/octet-stream';
    payload = base64ToBlob(payload, ct);
  }

  if (res.status >= 400) {
    const err = new AxiosError(
      `Request failed with status code ${res.status}`,
      AxiosError.ERR_BAD_RESPONSE,
      config,
      {},
      {
        status: res.status,
        statusText: String(res.status),
        data: payload,
        headers: res.headers as never,
        config,
      },
    );
    throw err;
  }

  return {
    data: payload,
    status: res.status,
    statusText: 'OK',
    headers: res.headers as never,
    config,
    request: {},
  };
};

export function attachNativeHttpAdapter(instance: ReturnType<typeof axios.create>): void {
  if (Capacitor.isNativePlatform()) {
    instance.defaults.adapter = capacitorHttpAdapter;
  }
}
