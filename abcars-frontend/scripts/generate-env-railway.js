/**
 * Genera environment.ts y environment.production.ts con la URL del backend desde API_URL.
 * El compilador resuelve imports a environment.ts; ese archivo no está en el repo (gitignore),
 * así que lo creamos aquí junto con environment.production.ts para que el build no falle.
 * Uso: en Railway definir variable API_URL (ej. https://tu-backend.up.railway.app).
 */
const fs = require('fs');
const path = require('path');

let apiUrl = process.env.API_URL;
if (!apiUrl || typeof apiUrl !== 'string' || !apiUrl.trim()) {
  console.error('Error: API_URL debe estar definida (URL del backend en Railway).');
  process.exit(1);
}
apiUrl = apiUrl.trim();
if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
  apiUrl = 'https://' + apiUrl;
}
const baseUrl = apiUrl.replace(/'/g, "\\'");

const content = `export const environment = {
  production: true,
  baseUrl: '${baseUrl}'
};
`;

const envDir = path.join(__dirname, '..', 'src', 'environments');
fs.mkdirSync(envDir, { recursive: true });

const envTsPath = path.join(envDir, 'environment.ts');
const envProdPath = path.join(envDir, 'environment.production.ts');
fs.writeFileSync(envTsPath, content, 'utf8');
fs.writeFileSync(envProdPath, content, 'utf8');
console.log('Generado: environment.ts y environment.production.ts -> baseUrl:', apiUrl);
