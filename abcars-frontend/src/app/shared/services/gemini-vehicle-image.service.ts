import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import {
  PROMPT_HYP_OPACA,
  PROMPT_HYP_SOBREEXPUESTA,
  PRESERVE_CANVAS_SUFFIX,
  type HypEvidencePromptId,
} from '../constants/hyp-evidence-prompts';
import { STUDIO_CATALOG_COLOR_HINT } from '../utils/studio-catalog-background';

const MODEL = 'gemini-3.1-flash-image-preview';

const PROMPT_RECORTE = `Recorte y fondo: detecta el vehículo principal, recorta y aísla el auto del entorno original. Sustituye el fondo por el mismo estudio de catálogo ABCars: ciclorama continuo, neutro, sin personas ni carteles (${STUDIO_CATALOG_COLOR_HINT}). Embellece la imagen: limpia suciedad leve, reflejos más equilibrados y acabado premium. Mantén la identidad exacta del coche (modelo, proporciones, llantas, emblemas).`;

const STUDIO_RECORTE_SUFFIX = `[Technical output requirement] Deliver a professional vehicle cutout on a new background. Replace the entire original scene with that exact neutral cyclorama look (${STUDIO_CATALOG_COLOR_HINT})—seamless wall-to-floor curve, no textures, no people, no signage, no random objects. Tight, balanced framing around the vehicle with consistent margins. Beautify subtly: reduce visible dirt, balance reflections, catalog-quality finish. Do NOT change the vehicle's identity, geometry, badges, wheels, or proportions—photorealistic edges and a soft natural contact shadow on the new floor.`;

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
    const out: File[] = [];
    const n = files.length;
    for (let i = 0; i < n; i++) {
      onProgress?.(i + 1, n);
      out.push(
        await this.generateTransformedFile(files[i], promptText, {
          aspectRatio: '4:3',
          imageSize: '2K',
        }, false),
      );
    }
    return out;
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
