import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  PROMPT_HYP_OPACA,
  PROMPT_HYP_SOBREEXPUESTA,
  PRESERVE_CANVAS_SUFFIX,
  type HypEvidencePromptId,
} from '../constants/hyp-evidence-prompts';
import {
  STUDIO_CATALOG_COLOR_HINT,
  STUDIO_CATALOG_HEX_SPEC_EN,
} from '../utils/studio-catalog-background';

const MODEL = 'gemini-3.1-flash-image-preview';

const PROMPT_RECORTE = `Recorte y fondo: detecta el vehículo principal, recorta y aísla el auto. Elimina por completo el entorno original (techo, paredes, columnas, suelo viejo, cielo, árboles, carteles): no lo dejes difuminado ni en una franja superior. Sustituye el 100% del fondo por el estudio de catálogo ABCars, un solo ciclorama continuo (${STUDIO_CATALOG_COLOR_HINT}). Embellece: suciedad leve, reflejos equilibrados, acabado premium. Mantén la identidad exacta del coche (modelo, proporciones, llantas, emblemas).`;

const STUDIO_RECORTE_SUFFIX =
  `[Technical output requirement] ${STUDIO_CATALOG_HEX_SPEC_EN} ` +
  `Full-frame cyclorama only: every pixel outside the vehicle silhouette must use only this fixed palette—no visible original environment ` +
  `(no blurred ceiling, lights, pillars, showroom, sky, or horizon from the source photo). ` +
  `No horizontal “blend band” between old scene and studio. Seamless wall-to-floor curve only. ` +
  `Tight framing around the vehicle with consistent margins. Subtle beautify: dirt reduction, balanced reflections, catalog finish. ` +
  `Do NOT change vehicle identity, geometry, badges, wheels, or proportions. Photorealistic edges and a soft natural contact shadow on the new floor.`;

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
const SERVER_GENERATE_RECORTE_TIMEOUT_MS = 200_000;
const MAX_FULL_ROUNDS = 3;

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

type GeminiCapabilitiesResponse = {
  status?: number;
  data?: { server_gemini?: boolean | string | number };
  server_gemini?: boolean | string | number;
};

@Injectable({ providedIn: 'root' })
export class GeminiVehicleImageService {
  private serverGeminiAvailable = false;

  constructor(private readonly http: HttpClient) {}

  isConfigured(): boolean {
    return Boolean(environment.geminiApiKey?.trim()) || this.serverGeminiAvailable;
  }

  /** Consulta GEMINI_API_KEY en Laravel (misma lógica que la app móvil). */
  async refreshGenerationAvailability(): Promise<boolean> {
    if (environment.geminiApiKey?.trim()) {
      this.serverGeminiAvailable = false;
      return true;
    }
    try {
      const raw = await firstValueFrom(
        this.http.get<GeminiCapabilitiesResponse>(
          `${environment.baseUrl}/api/studio-catalog/gemini/capabilities`,
          { headers: this.authHeaders() },
        ),
      );
      this.serverGeminiAvailable = this.parseServerGeminiFlag(raw);
      return this.isConfigured();
    } catch {
      this.serverGeminiAvailable = false;
      return false;
    }
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('user_token') ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });
  }

  private parseServerGeminiFlag(raw: GeminiCapabilitiesResponse): boolean {
    const v =
      raw?.data?.server_gemini ??
      raw?.server_gemini;
    if (v === true || v === 1) {
      return true;
    }
    if (typeof v === 'string') {
      const s = v.toLowerCase();
      return s === 'true' || s === '1' || s === 'yes';
    }
    return false;
  }

  /**
   * HyP: evidencia documental (sobreexpuesta o opaca). Mismo lienzo; no se guarda en ABCars.
   */
  async processHypEvidenceFiles(
    files: File[],
    variant: HypEvidencePromptId,
    onProgress?: (index: number, total: number) => void,
  ): Promise<File[]> {
    if (!this.isConfigured()) {
      throw new Error('Falta geminiApiKey en environment.');
    }
    const base =
      variant === 'sobreexpuesta'
        ? PROMPT_HYP_SOBREEXPUESTA
        : PROMPT_HYP_OPACA;
    const promptText = `${base.trim()}\n\n${PRESERVE_CANVAS_SUFFIX}`;
    const out: File[] = [];
    const n = files.length;
    for (let i = 0; i < n; i++) {
      onProgress?.(i + 1, n);
      out.push(
        await this.generateTransformedFile(files[i], promptText, null, true),
      );
    }
    return out;
  }

  async processFilesRecorteEmbellecer(
    files: File[],
    onProgress?: (index: number, total: number) => void,
  ): Promise<File[]> {
    const useClient = Boolean(environment.geminiApiKey?.trim());
    const useServer =
      !useClient &&
      (this.serverGeminiAvailable || (await this.refreshGenerationAvailability()));
    if (!useClient && !useServer) {
      throw new Error(
        'IA no disponible. Configura geminiApiKey en environment o GEMINI_API_KEY en el backend.',
      );
    }
    const promptText = useClient
      ? `${PROMPT_RECORTE.trim()}\n\n${STUDIO_RECORTE_SUFFIX}`
      : '';
    const out: File[] = [];
    const n = files.length;
    for (let i = 0; i < n; i++) {
      onProgress?.(i + 1, n);
      if (useClient) {
        out.push(
          await this.generateTransformedFile(files[i], promptText, {
            aspectRatio: '4:3',
            imageSize: '2K',
          }, false),
        );
      } else {
        out.push(await this.generateRecorteViaServer(files[i]));
      }
    }
    return out;
  }

  private async generateRecorteViaServer(file: File): Promise<File> {
    const { mime, base64 } = await this.fileToBase64(file);
    const raw = await firstValueFrom(
      this.http
        .post<{
          status?: number;
          message?: string;
          data?: { mime?: string; base64?: string };
        }>(
          `${environment.baseUrl}/api/studio-catalog/gemini/generate-recorte`,
          { mime, image_base64: base64 },
          { headers: this.authHeaders().set('Content-Type', 'application/json') },
        )
        .pipe(timeout(SERVER_GENERATE_RECORTE_TIMEOUT_MS)),
    );
    if (Number(raw?.status) !== 200 || !raw?.data?.base64) {
      throw new Error(raw?.message || 'Error al generar imagen en el servidor.');
    }
    const outMime = raw.data.mime || 'image/png';
    return await this.dataUrlToFile(
      `data:${outMime};base64,${raw.data.base64}`,
      file.name,
    );
  }

  private generateContentUrl(): string {
    const path = `/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`;
    if (!environment.production && environment.geminiUseDevProxy) {
      return `/gemini-api${path}`;
    }
    const base =
      environment.geminiApiBaseUrl?.replace(/\/$/, '') ||
      'https://generativelanguage.googleapis.com';
    return `${base}${path}`;
  }

  private async fileToBase64(file: File): Promise<{ mime: string; base64: string }> {
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

  async dataUrlToFile(dataUrl: string, originalName: string): Promise<File> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = this.extFromMime(blob.type) || this.extFromName(originalName);
    const base = originalName.replace(/\.[^/.]+$/, '') || 'vehiculo';
    return new File([blob], `${base}.${ext}`, { type: blob.type || 'image/jpeg' });
  }

  private extFromMime(mime: string): string | null {
    const m = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    } as Record<string, string>;
    return m[mime.toLowerCase()] ?? null;
  }

  private extFromName(name: string): string {
    const m = name.match(/\.([^.]+)$/);
    const e = (m?.[1] || 'jpg').toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(e)) return e === 'jpeg' ? 'jpg' : e;
    return 'jpg';
  }

  private extractImageDataUrl(parsed: GenResponse): string {
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

  /**
   * @param imageConfig null = sin imageConfig (modo evidencia / mismo lienzo)
   * @param compareIdenticalInput si true y salida = entrada en base64, error
   */
  private async generateTransformedFile(
    file: File,
    promptText: string,
    imageConfig: { aspectRatio: string; imageSize: string } | null,
    compareIdenticalInput: boolean,
  ): Promise<File> {
    const { mime, base64 } = await this.fileToBase64(file);
    const generationConfig: Record<string, unknown> = {
      responseModalities: ['TEXT', 'IMAGE'],
    };
    if (imageConfig) {
      generationConfig.imageConfig = imageConfig;
    }
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

    const url = this.generateContentUrl();
    const key = environment.geminiApiKey!.trim();
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

        const dataUrl = this.extractImageDataUrl(parsed);
        const outB64 = dataUrl.match(/^data:[^;]+;base64,(.+)$/s)?.[1];
        if (
          compareIdenticalInput &&
          outB64 &&
          outB64 === base64
        ) {
          throw new Error(
            'La API devolvió la misma imagen que la entrada. Prueba otra foto o reintenta.',
          );
        }
        return await this.dataUrlToFile(dataUrl, file.name);
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
}
