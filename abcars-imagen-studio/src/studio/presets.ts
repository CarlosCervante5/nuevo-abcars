/**
 * Opciones para Gemini imagen. `imageConfig` solo en modo recorte/fondo.
 * Docs: https://ai.google.dev/gemini-api/docs/image-generation
 */
export type GeminiPresetApiOptions = {
  model: string
  /** Modo recorte: proporción y tamaño de salida (Gemini imageConfig). */
  imageConfig?: { aspectRatio: string; imageSize: string }
}

export const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image-preview'

export function defaultGeminiApiOptions(): GeminiPresetApiOptions {
  return { model: DEFAULT_GEMINI_IMAGE_MODEL }
}
