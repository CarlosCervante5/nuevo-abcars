import { buildRecortePrompt } from '../config/studioCatalogPrompts';
import api from './api';

const MODEL = 'gemini-3.1-flash-image-preview';

type GenResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: { mimeType?: string; data?: string };
        inline_data?: { mime_type?: string; data?: string };
      }>;
    };
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

const ATTEMPT_TIMEOUT_MS = 180_000;
const MAX_FULL_ROUNDS = 3;
/** Debe ser ≥ tiempo de espera de Laravel a Gemini (`Http::timeout(180)`) + margen de red/JSON. */
const SERVER_GENERATE_RECORTE_TIMEOUT_MS = 200_000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetriableNetworkError(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  if (e instanceof DOMException && e.name === 'AbortError') return true;
  if (e instanceof Error) {
    if (e.name === 'AbortError') return true;
    const m = e.message.toLowerCase();
    return (
      m.includes('network') ||
      m.includes('failed to fetch') ||
      m.includes('fetch') ||
      m.includes('chunk') ||
      m.includes('incomplete') ||
      m.includes('aborted')
    );
  }
  return false;
}

function geminiApiKey(): string {
  return (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
}

function generateContentUrl(): string {
  const path = `/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`;
  const useProxy =
    import.meta.env.DEV && import.meta.env.VITE_GEMINI_USE_DEV_PROXY === '1';
  if (useProxy) {
    return `/gemini-api${path}`;
  }
  const base =
    (import.meta.env.VITE_GEMINI_API_BASE_URL || '').trim().replace(/\/$/, '') ||
    'https://generativelanguage.googleapis.com';
  return `${base}${path}`;
}

async function fileToBase64(
  file: File,
): Promise<{ mime: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result);
      const m = s.match(/^data:([^;]*);base64,(.+)$/s);
      if (!m) {
        reject(new Error('No se pudo codificar la imagen'));
        return;
      }
      resolve({
        mime: (m[1] || file.type || 'image/jpeg').trim() || 'image/jpeg',
        base64: m[2] ?? '',
      });
    };
    r.onerror = () => reject(r.error ?? new Error('Lectura de archivo fallida'));
    r.readAsDataURL(file);
  });
}

function extFromMime(mime: string): string | null {
  const m: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return m[mime.toLowerCase()] ?? null;
}

function extFromName(name: string): string {
  const match = name.match(/\.([^.]+)$/);
  const e = (match?.[1] || 'jpg').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp'].includes(e)) return e === 'jpeg' ? 'jpg' : e;
  return 'jpg';
}

async function dataUrlToFile(dataUrl: string, originalName: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = extFromMime(blob.type) || extFromName(originalName);
  const base = originalName.replace(/\.[^/.]+$/, '') || 'vehiculo';
  return new File([blob], `${base}.${ext}`, {
    type: blob.type || 'image/jpeg',
  });
}

function extractImageDataUrl(parsed: GenResponse): string {
  if (parsed.error?.message) {
    throw new Error(parsed.error.message);
  }
  const block = parsed.promptFeedback?.blockReason;
  if (block) {
    throw new Error(`Contenido bloqueado (${block}).`);
  }
  const parts = parsed.candidates?.[0]?.content?.parts;
  if (!parts?.length) {
    throw new Error('La API no devolvió imagen.');
  }
  for (const p of parts) {
    const raw = p.inlineData?.data ?? p.inline_data?.data;
    if (!raw) continue;
    const mime =
      p.inlineData?.mimeType ?? p.inline_data?.mime_type ?? 'image/png';
    return `data:${mime};base64,${raw}`;
  }
  throw new Error('La respuesta no incluye datos de imagen.');
}

async function generateTransformedFile(
  file: File,
  promptText: string,
  imageConfig: { aspectRatio: string; imageSize: string },
): Promise<File> {
  const key = geminiApiKey();
  if (!key) {
    throw new Error('Falta VITE_GEMINI_API_KEY.');
  }

  const { mime, base64 } = await fileToBase64(file);
  const generationConfig: Record<string, unknown> = {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig,
  };
  const body = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inline_data: {
              mime_type: mime,
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig,
  };

  const url = generateContentUrl();
  let lastErr = 'Error desconocido';

  for (let round = 0; round < MAX_FULL_ROUNDS; round++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), ATTEMPT_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-goog-api-key': key,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: ac.signal,
      });

      let text: string;
      try {
        text = await res.text();
      } catch (e) {
        lastErr = e instanceof Error ? e.message : 'Respuesta cortada';
        if (round < MAX_FULL_ROUNDS - 1) {
          clearTimeout(timer);
          await sleep(2500 * (round + 1));
          continue;
        }
        throw new Error(lastErr);
      } finally {
        clearTimeout(timer);
      }

      let parsed: GenResponse;
      try {
        parsed = JSON.parse(text) as GenResponse;
      } catch {
        if (round < MAX_FULL_ROUNDS - 1) {
          await sleep(2500 * (round + 1));
          continue;
        }
        throw new Error(text.slice(0, 200) || `HTTP ${res.status}`);
      }

      if (!res.ok) {
        const msg = parsed.error?.message ?? text.slice(0, 300);
        if ([429, 500, 502, 503].includes(res.status) && round < MAX_FULL_ROUNDS - 1) {
          await sleep(Math.min(45_000, 2000 * 2 ** round));
          continue;
        }
        throw new Error(msg || `Error Gemini (${res.status})`);
      }

      const dataUrl = extractImageDataUrl(parsed);
      return await dataUrlToFile(dataUrl, file.name);
    } catch (e) {
      clearTimeout(timer);
      lastErr = e instanceof Error ? e.message : String(e);
      if (isRetriableNetworkError(e) && round < MAX_FULL_ROUNDS - 1) {
        await sleep(Math.min(60_000, 2500 * 2 ** round));
        continue;
      }
      throw e instanceof Error ? e : new Error(lastErr);
    }
  }
  throw new Error(lastErr);
}

type GeminiCapabilitiesPayload = {
  status?: number;
  message?: string;
  data?: { server_gemini?: boolean | string | number };
};

function parseServerGeminiFlag(raw: unknown): boolean {
  if (raw == null) {
    return false;
  }
  let o: unknown = raw;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t.startsWith('{') && !t.startsWith('[')) {
      return false;
    }
    try {
      o = JSON.parse(t) as unknown;
    } catch {
      return false;
    }
  }
  if (typeof o !== 'object' || o === null) {
    return false;
  }
  const rec = o as Record<string, unknown>;
  const inner = rec.data;
  let v: unknown;
  if (inner && typeof inner === 'object' && inner !== null && 'server_gemini' in (inner as object)) {
    v = (inner as Record<string, unknown>).server_gemini;
  } else if ('server_gemini' in rec) {
    v = rec.server_gemini;
  } else {
    return false;
  }
  if (v === true || v === 1) {
    return true;
  }
  if (v === false || v === 0 || v === null || v === '') {
    return false;
  }
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
  }
  return false;
}

async function fetchServerGeminiCapability(): Promise<boolean> {
  try {
    const r = await api.get<unknown>('studio-catalog/gemini/capabilities');
    return parseServerGeminiFlag(r.data);
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[Gemini] capabilities falló:', e);
    }
    return false;
  }
}

/** Generación vía Laravel (GEMINI_API_KEY en servidor); JSON, compatible con HTTP nativo en Android. */
async function generateTransformedFileViaServer(file: File): Promise<File> {
  const { mime, base64 } = await fileToBase64(file);
  const res = await api.post<unknown>(
    'studio-catalog/gemini/generate-recorte',
    {
      mime,
      image_base64: base64,
    },
    { timeout: SERVER_GENERATE_RECORTE_TIMEOUT_MS },
  );
  const body = res.data as {
    status?: number;
    message?: string;
    data?: { mime?: string; base64?: string };
  };
  if (Number(body?.status) !== 200 || !body?.data?.base64) {
    throw new Error(body?.message || 'Error al generar imagen en el servidor.');
  }
  const outMime = body.data.mime || 'image/png';
  const dataUrl = `data:${outMime};base64,${body.data.base64}`;
  return await dataUrlToFile(dataUrl, file.name);
}

export const geminiVehicleImageService = {
  /** Solo clave embebida en el build (Vite). */
  isConfigured(): boolean {
    return Boolean(geminiApiKey());
  },

  /** Clave en cliente o proxy configurado en el backend (GEMINI_API_KEY). */
  async isGenerationAvailable(): Promise<boolean> {
    if (Boolean(geminiApiKey())) {
      return true;
    }
    return fetchServerGeminiCapability();
  },

  /** Recorte estudio + ciclorama + embellecimiento (misma lógica que el panel web). */
  async processFilesRecorteEmbellecer(
    files: File[],
    onProgress?: (index: number, total: number) => void,
  ): Promise<File[]> {
    const useClient = Boolean(geminiApiKey());
    const useServer = !useClient && (await fetchServerGeminiCapability());
    if (!useClient && !useServer) {
      throw new Error(
        'IA no disponible. Define GEMINI_API_KEY en el backend o VITE_GEMINI_API_KEY al compilar la app.',
      );
    }
    const promptText = useClient ? buildRecortePrompt() : '';
    const out: File[] = [];
    const n = files.length;
    for (let i = 0; i < n; i++) {
      onProgress?.(i + 1, n);
      if (useClient) {
        out.push(
          await generateTransformedFile(files[i], promptText, {
            aspectRatio: '4:3',
            imageSize: '2K',
          }),
        );
      } else {
        out.push(await generateTransformedFileViaServer(files[i]));
      }
    }
    return out;
  },

  /** Vuelve a consultar al servidor (útil al entrar en la pantalla con sesión ya lista). */
  async refreshGenerationAvailability(): Promise<boolean> {
    return this.isGenerationAvailable();
  },
};
