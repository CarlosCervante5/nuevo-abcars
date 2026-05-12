/**
 * API key de Google AI Studio / Gemini API (misma clave que para generateContent).
 * https://aistudio.google.com/apikey
 */

export function getGeminiApiKey(): string {
  return import.meta.env.VITE_GEMINI_API_KEY?.trim() ?? ''
}

/** Base sin barra final: origen de la API Generative Language. */
export function getGeminiApiOrigin(): string {
  const custom = import.meta.env.VITE_GEMINI_API_ORIGIN?.trim()
  if (custom) return custom.replace(/\/$/, '')

  const devProxyOff = import.meta.env.VITE_GEMINI_DEV_PROXY === '0'
  if (import.meta.env.DEV && !devProxyOff) {
    return ''
  }

  return 'https://generativelanguage.googleapis.com'
}

export function getGeminiGenerateContentUrl(model: string): string {
  const origin = getGeminiApiOrigin()
  const path = `/v1beta/models/${encodeURIComponent(model)}:generateContent`
  if (!origin) {
    return `/gemini-api${path}`
  }
  return `${origin}${path}`
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey())
}
