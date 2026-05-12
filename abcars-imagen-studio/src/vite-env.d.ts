/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Clave de Google AI Studio / Gemini API */
  readonly VITE_GEMINI_API_KEY: string
  /** Origen alternativo (sin barra final), p. ej. proxy propio */
  readonly VITE_GEMINI_API_ORIGIN: string
  /** Pon `0` para llamar directo a generativelanguage.googleapis.com en dev (requiere CORS) */
  readonly VITE_GEMINI_DEV_PROXY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
