/**
 * Genera environment.ts y environment.production.ts para el build en Railway.
 * Obligatoria: API_URL (URL del backend).
 * Opcionales (Gemini / Imagen Studio): IMAGEN_STUDIO_URL, GEMINI_API_KEY, GEMINI_API_BASE_URL
 *
 * El compilador importa @environments/environment; estos archivos suelen estar en .gitignore
 * en CI, por eso los generamos aquí antes de `ng build`.
 */
const fs = require('fs');
const path = require('path');

/** Escapa comillas simples y barras invertidas para literales TS entre comillas simples. */
function q(s) {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

let apiUrl = process.env.API_URL;
if (!apiUrl || typeof apiUrl !== 'string' || !apiUrl.trim()) {
  console.error('Error: API_URL debe estar definida (URL del backend en Railway).');
  process.exit(1);
}
apiUrl = apiUrl.trim();
if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
  apiUrl = 'https://' + apiUrl;
}

const baseUrl = q(apiUrl);
const imagenStudioUrl = q((process.env.IMAGEN_STUDIO_URL || '').trim());
const geminiApiKey = q((process.env.GEMINI_API_KEY || '').trim());
const geminiApiBaseRaw = (process.env.GEMINI_API_BASE_URL || '').trim();
const geminiApiBaseUrl = q(
  geminiApiBaseRaw || 'https://generativelanguage.googleapis.com',
);

const content = `export const environment = {
  production: true,
  baseUrl: '${baseUrl}',
  apiUrl: '${baseUrl}',
  imagenStudioUrl: '${imagenStudioUrl}',
  geminiApiKey: '${geminiApiKey}',
  geminiUseDevProxy: false,
  geminiApiBaseUrl: '${geminiApiBaseUrl}',
};
`;

const envDir = path.join(__dirname, '..', 'src', 'environments');
fs.mkdirSync(envDir, { recursive: true });

const envTsPath = path.join(envDir, 'environment.ts');
const envProdPath = path.join(envDir, 'environment.production.ts');
fs.writeFileSync(envTsPath, content, 'utf8');
fs.writeFileSync(envProdPath, content, 'utf8');
console.log('Generado: environment.ts y environment.production.ts -> baseUrl:', apiUrl);
