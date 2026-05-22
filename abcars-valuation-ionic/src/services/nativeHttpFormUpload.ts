import { Capacitor } from '@capacitor/core';
import { Http } from '@capacitor-community/http';
import { Directory, Filesystem } from '@capacitor/filesystem';
import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { fileToBase64 } from '../utils/fileToBase64';
import { logUploadDiagnostic } from '../utils/uploadDiagnostics';

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

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function parseResponseData(data: unknown): unknown {
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

function appendQueryParams(url: string, fields: Record<string, string>): string {
  const parts = Object.entries(fields).map(
    ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
  );
  if (parts.length === 0) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${parts.join('&')}`;
}

/**
 * Subida multipart en Android/iOS: el XHR del WebView falla con «Network Error» por CORS.
 * En Android el plugin envía los campos de texto después del archivo; vehicle_uuid va también en query.
 */
export async function postFormDataViaNativeHttp(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse> {
  const form = config.data as FormData;
  let url = axios.getUri(config);
  const headers = headersToRecord(config);
  delete headers['Content-Type'];
  delete headers['content-type'];
  if (!headers.Accept && !headers.accept) {
    headers.Accept = 'application/json';
  }

  const textFields: Record<string, string> = {};
  const files: File[] = [];
  form.forEach((value, key) => {
    if (value instanceof File) {
      files.push(value);
    } else {
      textFields[key] = String(value);
    }
  });

  let lastStatus = 200;
  let lastPayload: unknown = null;

  const timeoutMs =
    typeof config.timeout === 'number' && config.timeout > 0 ? config.timeout : 180000;

  const uploadOne = async (file: File, index: number) => {
    const path = `abcars_upload_${Date.now()}_${index}.jpg`;
    const b64 = await fileToBase64(file);
    await Filesystem.writeFile({
      path,
      data: b64,
      directory: Directory.Cache,
    });

    const uploadUrl = appendQueryParams(url, textFields);

    try {
      logUploadDiagnostic('nativeHttp.uploadFile:start', {
        url: uploadUrl,
        filePath: path,
        fileKb: Math.round(file.size / 1024),
        fields: textFields,
      });
      const res = await Http.uploadFile({
        url: uploadUrl,
        name: 'images[]',
        filePath: path,
        fileDirectory: Directory.Cache,
        headers,
        data: textFields,
        readTimeout: timeoutMs,
        connectTimeout: Math.min(timeoutMs, 90000),
      });
      lastStatus = res.status;
      lastPayload = parseResponseData(res.data);
      logUploadDiagnostic('nativeHttp.uploadFile:done', {
        httpStatus: lastStatus,
        body: lastPayload,
      });
      if (lastStatus >= 400) {
        throw new AxiosError(
          `Request failed with status code ${lastStatus}`,
          AxiosError.ERR_BAD_RESPONSE,
          config,
          {},
          {
            status: lastStatus,
            statusText: String(lastStatus),
            data: lastPayload,
            headers: res.headers as never,
            config,
          },
        );
      }
      const bodyStatus =
        isRecord(lastPayload) && typeof lastPayload.status === 'number'
          ? lastPayload.status
          : null;
      if (bodyStatus != null && bodyStatus >= 400) {
        throw new AxiosError(
          `API status ${bodyStatus} in response body`,
          AxiosError.ERR_BAD_RESPONSE,
          config,
          {},
          {
            status: lastStatus,
            statusText: String(bodyStatus),
            data: lastPayload,
            headers: res.headers as never,
            config,
          },
        );
      }
    } catch (e: unknown) {
      if (!axios.isAxiosError(e)) {
        const msg = e instanceof Error ? e.message : String(e);
        logUploadDiagnostic('nativeHttp.uploadFile:throw', { message: msg, url: uploadUrl });
        throw new AxiosError(
          `Subida nativa falló: ${msg}`,
          AxiosError.ERR_NETWORK,
          config,
          {},
          {
            status: 0,
            statusText: 'Native upload error',
            data: { message: msg, status: 0 },
            headers: {} as never,
            config,
          },
        );
      }
      throw e;
    } finally {
      try {
        await Filesystem.deleteFile({ path, directory: Directory.Cache });
      } catch {
        /* cache */
      }
    }
  };

  if (files.length === 0) {
    const res = await Http.request({
      method: (config.method || 'post').toUpperCase(),
      url: appendQueryParams(url, textFields),
      headers: { ...headers, 'Content-Type': 'application/json' },
      data: JSON.stringify(textFields),
      params: {},
      readTimeout: timeoutMs,
      connectTimeout: Math.min(timeoutMs, 90000),
    });
    lastStatus = res.status;
    lastPayload = parseResponseData(res.data);
  } else {
    for (let i = 0; i < files.length; i++) {
      await uploadOne(files[i], i);
    }
  }

  return {
    data: lastPayload,
    status: lastStatus,
    statusText: 'OK',
    headers: {} as never,
    config,
    request: {},
  };
}

export function shouldUseNativeFormUpload(): boolean {
  return Capacitor.isNativePlatform();
}
