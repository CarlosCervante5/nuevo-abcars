/**
 * Plantilla para desarrollo local.
 * Copia este archivo a `environment.ts` (gitignored) y rellena `geminiApiKey`:
 *   cp src/environments/environment.example.ts src/environments/environment.ts
 * Clave: Google AI Studio (misma que VITE_GEMINI_API_KEY en abcars-imagen-studio/.env).
 *
 * Con `geminiUseDevProxy: true` y `ng serve`, las llamadas a Gemini van a `/gemini-api/*`
 * y `proxy.conf.json` las reenvía a generativelanguage.googleapis.com (evita CORS en el navegador).
 */
export const environment = {
  production: false,
  baseUrl: 'http://127.0.0.1:8000',
  apiUrl: 'http://127.0.0.1:8000',
  imagenStudioUrl: 'http://localhost:5176/',
  geminiApiKey: '',
  geminiUseDevProxy: true,
  geminiApiBaseUrl: 'https://generativelanguage.googleapis.com',
};
