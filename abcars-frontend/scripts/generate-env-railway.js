/**
 * Genera environment.production.ts con la URL del backend desde API_URL.
 * Uso: en Railway definir variable API_URL; este script se ejecuta antes del build.
 */
const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL;
if (!apiUrl || typeof apiUrl !== 'string' || !apiUrl.trim()) {
  console.error('Error: API_URL debe estar definida (URL del backend en Railway).');
  process.exit(1);
}

const baseUrl = apiUrl.trim().replace(/'/g, "\\'");
const envPath = path.join(__dirname, '..', 'src', 'environments', 'environment.production.ts');
const content = `export const environment = {
  production: true,
  baseUrl: '${baseUrl}'
};
`;

fs.mkdirSync(path.dirname(envPath), { recursive: true });
fs.writeFileSync(envPath, content, 'utf8');
console.log('Generado:', envPath, '-> baseUrl:', apiUrl.trim());
