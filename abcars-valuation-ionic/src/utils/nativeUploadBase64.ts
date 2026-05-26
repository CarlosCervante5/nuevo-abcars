import { getApiBaseUrl } from '../config/apiBaseUrl';
import { fileToBase64 } from './fileToBase64';
import { logUploadDiagnostic } from './uploadDiagnostics';

function resolveUploadBase64Url(): string {
  const base = getApiBaseUrl().replace(/\/+$/, '');
  return `${base}/vehicle_images/upload_base64`;
}

/**
 * Subida base64 vía XHR del WebView (no @capacitor-community/http).
 * Evita UnknownHostException cuando el JSON es grande y el bridge nativo trunca la URL.
 */
export async function uploadVehicleImageBase64Native(
  vehicleUuid: string,
  file: File,
  timeoutMs = 180000,
): Promise<{ status: number; message?: string }> {
  const url = resolveUploadBase64Url();
  const image_base64 = await fileToBase64(file);
  const body = {
    vehicle_uuid: vehicleUuid,
    filename: file.name,
    image_base64,
  };
  const bodyKb = Math.round(JSON.stringify(body).length / 1024);

  logUploadDiagnostic('nativeUploadBase64.xhr:start', {
    url,
    filename: file.name,
    fileKb: Math.round(file.size / 1024),
    jsonBodyKb: bodyKb,
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = timeoutMs;
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    const token = localStorage.getItem('auth_token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.onload = () => {
      let parsed: { status?: number; message?: string } = {};
      const text = xhr.responseText || '';
      try {
        parsed = text ? (JSON.parse(text) as { status?: number; message?: string }) : {};
      } catch {
        parsed = { message: text.slice(0, 300) };
      }

      logUploadDiagnostic('nativeUploadBase64.xhr:done', {
        url,
        httpStatus: xhr.status,
        apiStatus: parsed.status,
        message: parsed.message,
      });

      const apiStatus = Number(parsed.status ?? xhr.status);
      if (xhr.status >= 400 || apiStatus >= 400) {
        const err = new Error(
          parsed.message || `Error HTTP ${xhr.status} al subir foto`,
        ) as Error & { response?: { status: number; data: unknown } };
        err.response = { status: xhr.status, data: parsed };
        reject(err);
        return;
      }
      resolve({ status: apiStatus, message: parsed.message });
    };

    xhr.onerror = () => {
      const err = new Error(
        `Error de red al subir (${xhr.status || 0}). Host: ${new URL(url).host}`,
      );
      logUploadDiagnostic('nativeUploadBase64.xhr:error', {
        url,
        readyState: xhr.readyState,
        status: xhr.status,
      });
      reject(err);
    };

    xhr.ontimeout = () => {
      reject(new Error(`Tiempo de espera agotado subiendo a ${new URL(url).host}`));
    };

    xhr.send(JSON.stringify(body));
  });
}
