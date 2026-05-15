import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import {
  PROMPT_HYP_OPACA,
  PROMPT_HYP_SOBREEXPUESTA,
  PRESERVE_CANVAS_SUFFIX,
  type HypEvidencePromptId,
} from '../constants/hyp-evidence-prompts';
import { StudioCatalogService } from './studio-catalog.service';
import { compositeDataUrlOverStudioBackground } from '../utils/studio-catalog-background';

const MODEL = 'gemini-3.1-flash-image-preview';

const PROMPT_RECORTE = `Recorte del vehículo: detecta el auto principal y elimina por completo el entorno original (techo, paredes, suelo, cielo, carteles). Devuelve solo el vehículo aislado con fondo 100 % transparente (PNG con canal alpha). Embellece ligeramente: suciedad leve, reflejos equilibrados, acabado premium. Mantén la identidad exacta del coche (modelo, proporciones, llantas, emblemas). Puedes añadir una sombra de contacto suave bajo las ruedas integrada en el alpha.`;

const STUDIO_RECORTE_SUFFIX = `[Technical output requirement] Output MUST be PNG with alpha channel outside the vehicle silhouette. Every pixel outside the car must be fully transparent — NO studio background, NO cyclorama, NO gray backdrop, NO floor plane, NO wall. Do NOT paint any environment. Absolutely no visible original scene (no blurred ceiling, pillars, or horizon). Preserve exact vehicle identity, geometry, badges, and wheels. Optional soft contact shadow only under tires within the alpha matte. Photorealistic cutout edges.`;

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

@Injectable({ providedIn: 'root' })
export class GeminiVehicleImageService {
  constructor(private readonly studioCatalog: StudioCatalogService) {}

  isConfigured(): boolean {
    return Boolean(environment.geminiApiKey?.trim());
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
    if (!this.isConfigured()) {
      throw new Error('Falta geminiApiKey en environment.');
    }
    const promptText = `${PROMPT_RECORTE.trim()}\n\n${STUDIO_RECORTE_SUFFIX}`;
    const compositeOptions = await this.studioCatalog.resolveCompositeOptions(true);
    const out: File[] = [];
    const n = files.length;
    for (let i = 0; i < n; i++) {
      onProgress?.(i + 1, n);
      const cutout = await this.generateTransformedFile(files[i], promptText, {
        aspectRatio: '4:3',
        imageSize: '2K',
      }, false);
      const dataUrl = await this.fileToDataUrl(cutout);
      const composed = await compositeDataUrlOverStudioBackground(dataUrl, {
        backgroundUrl: compositeOptions.backgroundUrl,
        width: compositeOptions.width,
        height: compositeOptions.height,
        mime: 'image/jpeg',
      });
      const base = files[i].name.replace(/\.[^/.]+$/, '') || 'vehiculo';
      out.push(new File([composed], `${base}-estudio.jpg`, { type: 'image/jpeg' }));
    }
    return out;
  }

  private async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error('Lectura de archivo fallida'));
      reader.readAsDataURL(file);
    });
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
