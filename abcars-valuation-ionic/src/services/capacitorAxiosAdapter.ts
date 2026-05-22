import { Capacitor } from '@capacitor/core';
import { Http } from '@capacitor-community/http';
import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import xhrAdapter from 'axios/lib/adapters/xhr.js';
import { postFormDataViaNativeHttp, shouldUseNativeFormUpload } from './nativeHttpFormUpload';

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

function prepareRequestBody(
  data: unknown,
  headers: Record<string, string>,
): string | Record<string, unknown> | undefined {
  if (data === undefined || data === null) {
    return undefined;
  }
  if (typeof data === 'string') {
    return data;
  }
  if (
    typeof data === 'object' &&
    !(data instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(data)
  ) {
    const ct = (headers['Content-Type'] || headers['content-type'] || '').toLowerCase();
    if (!ct || ct.includes('application/json')) {
      headers['Content-Type'] = 'application/json';
      return JSON.stringify(data);
    }
  }
  return data as string | Record<string, unknown>;
}

function parsePayload(data: unknown): unknown {
  if (typeof data === 'string') {
    const t = data.trim();
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        return JSON.parse(t) as unknown;
      } catch {
        return data;
      }
    }
  }
  return data;
}

/**
 * Peticiones HTTP nativas (sin CORS). En Android el WebView usa Origin https://localhost
 * y el backend a veces no devuelve ACAO; Axios falla con «Network Error».
 */
export const capacitorHttpAdapter: AxiosAdapter = async (config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (shouldUseNativeFormUpload()) {
      return postFormDataViaNativeHttp(config);
    }
    return xhrAdapter(config);
  }

  const method = (config.method || 'get').toUpperCase();
  const url = axios.getUri(config);
  const headers = headersToRecord(config);
  const body = prepareRequestBody(config.data, headers);

  const wantsBlob = config.responseType === 'blob' || config.responseType === 'arraybuffer';
  const httpResponseType = wantsBlob ? 'blob' : 'json';

  const timeout =
    typeof config.timeout === 'number' && config.timeout > 0 ? config.timeout : 30000;

  const res = await Http.request({
    method,
    url,
    headers,
    data: body,
    params: {},
    connectTimeout: timeout,
    readTimeout: timeout,
    responseType: httpResponseType,
    shouldEncodeUrlParams: true,
  });

  let payload: unknown = parsePayload(res.data);
  if (config.responseType === 'blob' && typeof payload === 'string') {
    const ct =
      (res.headers['content-type'] as string) ||
      (res.headers['Content-Type'] as string) ||
      'application/octet-stream';
    payload = base64ToBlob(payload, ct);
  }

  if (res.status >= 400) {
    throw new AxiosError(
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
