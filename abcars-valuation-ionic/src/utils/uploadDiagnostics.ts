import axios, { type AxiosError } from 'axios';

const LOG_TAG = '[ABCarsUpload]';

export type UploadErrorContext = {
  vehicleUuid?: string;
  photoIndex?: number;
  photoTotal?: number;
  fileName?: string;
  fileSizeKb?: number;
  step?: 'prepare' | 'upload' | 'ia';
};

type ApiErrorBody = {
  status?: number;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  data?: unknown;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function bodyFromAxios(error: AxiosError): ApiErrorBody | null {
  const data = error.response?.data;
  if (typeof data === 'string') {
    const t = data.trim();
    if (t.startsWith('{')) {
      try {
        return JSON.parse(t) as ApiErrorBody;
      } catch {
        return { message: t.slice(0, 280) };
      }
    }
    if (t.includes('<html')) {
      return { message: 'El servidor respondió HTML (no JSON). Posible error 502/503 en Railway.' };
    }
    return { message: t.slice(0, 280) };
  }
  if (isRecord(data)) {
    return data as ApiErrorBody;
  }
  return null;
}

function validationLines(errors?: Record<string, string[]>): string {
  if (!errors) return '';
  return Object.entries(errors)
    .map(([field, msgs]) => `${field}: ${(msgs || []).join(', ')}`)
    .join(' | ');
}

function networkHint(code?: string, message?: string): string {
  const m = (message || '').toLowerCase();
  if (code === 'ERR_NETWORK' || m.includes('network error') || m.includes('io error')) {
    return 'Sin conexión o bloqueo de red. Revisa WiFi/datos y que la API sandbox esté activa.';
  }
  if (m.includes('timeout') || code === 'ECONNABORTED') {
    return 'Tiempo de espera agotado. La imagen puede ser muy pesada o el servidor tardó demasiado.';
  }
  return '';
}

/**
 * Mensaje legible para toast/alerta en móvil.
 */
export function formatUploadError(error: unknown, ctx?: UploadErrorContext): string {
  const parts: string[] = [];
  const prefix =
    ctx?.photoIndex != null && ctx.photoTotal != null
      ? `Foto ${ctx.photoIndex}/${ctx.photoTotal}: `
      : '';

  if (axios.isAxiosError(error)) {
    const httpStatus = error.response?.status;
    const body = bodyFromAxios(error);
    const apiStatus = body?.status;
    const statusLabel =
      httpStatus != null && httpStatus > 0
        ? `HTTP ${httpStatus}`
        : apiStatus != null && apiStatus > 0
          ? `API ${apiStatus}`
          : httpStatus === 0 || apiStatus === 0
            ? 'HTTP 0 (sin respuesta del servidor)'
            : 'sin código HTTP';

    const val = validationLines(body?.errors);
    if (val) {
      parts.push(`${statusLabel} — validación: ${val}`);
    } else if (body?.message) {
      parts.push(`${statusLabel} — ${String(body.message)}`);
    } else if (body?.error) {
      parts.push(`${statusLabel} — ${String(body.error)}`);
    } else if (error.message) {
      parts.push(`${statusLabel} — ${error.message}`);
    } else {
      parts.push(statusLabel);
    }

    let hint = networkHint(error.code, error.message);
    if ((httpStatus === 0 || httpStatus == null) && error.config?.url?.includes('vehicle_images')) {
      hint =
        'La subida multipart nativa falló. Actualiza la app: en móvil se usa upload_base64. Si persiste, despliega el backend en Railway.';
    }
    if (hint) parts.push(hint);

    if (error.config?.url) {
      parts.push(`Ruta: ${error.config.url}`);
    }
  } else if (error instanceof Error) {
    parts.push(error.message || 'Error desconocido');
  } else {
    parts.push(String(error));
  }

  if (ctx?.fileName) {
    parts.push(`Archivo: ${ctx.fileName}`);
  }
  if (ctx?.fileSizeKb != null) {
    parts.push(`${ctx.fileSizeKb} KB`);
  }
  if (ctx?.step === 'ia') {
    parts.push('(falló procesamiento IA antes de subir)');
  }

  return prefix + parts.filter(Boolean).join('\n');
}

/**
 * Siempre escribe en consola (visible con `adb logcat` / WebView remoto).
 */
export function logUploadDiagnostic(
  where: string,
  payload: Record<string, unknown>,
): void {
  try {
    console.error(LOG_TAG, where, JSON.stringify(payload, null, 2));
  } catch {
    console.error(LOG_TAG, where, payload);
  }
}

/** @deprecated Usar formatUploadError */
export function getApiErrorMessage(error: unknown, fallback = 'Error en la solicitud'): string {
  const msg = formatUploadError(error);
  return msg && msg !== 'undefined' ? msg : fallback;
}
