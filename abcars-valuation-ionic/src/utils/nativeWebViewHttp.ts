import { getApiBaseUrl } from '../config/apiBaseUrl';

export type NativeJsonRequestOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

function resolveUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/+$/, '');
  const rel = path.replace(/^\//, '');
  return `${base}/${rel}`;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * JSON vía XHR del WebView. No usa @capacitor-community/http, así las peticiones
 * largas (Gemini) no bloquean GET del inventario en el mismo plugin nativo.
 */
export function postJsonViaWebView<T = unknown>(
  path: string,
  body: unknown,
  options: NativeJsonRequestOptions = {},
): Promise<T> {
  const url = resolveUrl(path);
  const timeoutMs = options.timeoutMs ?? 120000;

  return new Promise((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.timeout = timeoutMs;
    xhr.open('POST', url);
    const headers = authHeaders();
    for (const [k, v] of Object.entries(headers)) {
      xhr.setRequestHeader(k, v);
    }

    const onAbort = () => {
      xhr.abort();
      reject(new DOMException('Aborted', 'AbortError'));
    };
    options.signal?.addEventListener('abort', onAbort, { once: true });

    xhr.onload = () => {
      options.signal?.removeEventListener('abort', onAbort);
      let parsed: unknown = xhr.responseText;
      try {
        parsed = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      } catch {
        parsed = { message: xhr.responseText?.slice(0, 300) };
      }
      if (xhr.status >= 400) {
        const err = new Error(`HTTP ${xhr.status}`) as Error & {
          response?: { status: number; data: unknown };
        };
        err.response = { status: xhr.status, data: parsed };
        reject(err);
        return;
      }
      resolve(parsed as T);
    };

    xhr.onerror = () => {
      options.signal?.removeEventListener('abort', onAbort);
      reject(new Error(`Error de red (POST ${new URL(url).pathname})`));
    };

    xhr.ontimeout = () => {
      options.signal?.removeEventListener('abort', onAbort);
      reject(new Error('Tiempo de espera agotado'));
    };

    xhr.send(JSON.stringify(body));
  });
}

export function getJsonViaWebView<T = unknown>(
  pathWithQuery: string,
  options: NativeJsonRequestOptions = {},
): Promise<T> {
  const url = resolveUrl(pathWithQuery);
  const timeoutMs = options.timeoutMs ?? 60000;

  return new Promise((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.timeout = timeoutMs;
    xhr.open('GET', url);
    const headers = authHeaders();
    delete headers['Content-Type'];
    for (const [k, v] of Object.entries(headers)) {
      xhr.setRequestHeader(k, v);
    }

    const onAbort = () => {
      xhr.abort();
      reject(new DOMException('Aborted', 'AbortError'));
    };
    options.signal?.addEventListener('abort', onAbort, { once: true });

    xhr.onload = () => {
      options.signal?.removeEventListener('abort', onAbort);
      let parsed: unknown = xhr.responseText;
      try {
        parsed = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      } catch {
        parsed = { message: xhr.responseText?.slice(0, 300) };
      }
      if (xhr.status >= 400) {
        const err = new Error(`HTTP ${xhr.status}`) as Error & {
          response?: { status: number; data: unknown };
        };
        err.response = { status: xhr.status, data: parsed };
        reject(err);
        return;
      }
      resolve(parsed as T);
    };

    xhr.onerror = () => {
      options.signal?.removeEventListener('abort', onAbort);
      reject(new Error(`Error de red (GET ${new URL(url).pathname})`));
    };

    xhr.ontimeout = () => {
      options.signal?.removeEventListener('abort', onAbort);
      reject(new Error('Tiempo de espera agotado'));
    };

    xhr.send();
  });
}
