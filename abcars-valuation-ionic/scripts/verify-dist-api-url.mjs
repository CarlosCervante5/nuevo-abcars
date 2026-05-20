#!/usr/bin/env node
/**
 * Tras `vite build`, comprueba que el bundle incluye la misma VITE_API_BASE_URL
 * que en `.env.production` o `.env.production.local` (evita cap sync con dist viejo).
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const DIST_ASSETS = join(process.cwd(), 'dist', 'assets');

function parseViteApiBase(files) {
  for (const name of files) {
    const p = join(process.cwd(), name);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*VITE_API_BASE_URL\s*=\s*(.+?)\s*$/);
      if (m) {
        let v = m[1].trim().replace(/^["']|["']$/g, '');
        if (v && !v.startsWith('#')) return v;
      }
    }
  }
  return null;
}

function normalizeApiNeedle(url) {
  if (!url) return null;
  let u = url.trim().replace(/\/+$/, '');
  if (!/\/api$/i.test(u)) u = `${u}/api`;
  return `${u}/`;
}

const fromEnv =
  parseViteApiBase(['.env.production.local', '.env.production']) ||
  'https://nuevo-abcars-sandbox.up.railway.app/api/';
const NEEDLE = normalizeApiNeedle(fromEnv);

if (!NEEDLE) {
  console.error('verify-dist-api-url: no se pudo resolver VITE_API_BASE_URL.');
  process.exit(1);
}

if (!existsSync(DIST_ASSETS)) {
  console.error('verify-dist-api-url: no existe dist/assets. Ejecuta npm run build antes.');
  process.exit(1);
}

const files = readdirSync(DIST_ASSETS).filter((f) => /^index-.*\.js$/.test(f));
if (files.length === 0) {
  console.error('verify-dist-api-url: no hay index-*.js en dist/assets.');
  process.exit(1);
}

let okCount = 0;
for (const f of files) {
  const body = readFileSync(join(DIST_ASSETS, f), 'utf8');
  if (body.includes(NEEDLE)) {
    okCount++;
    console.log(`verify-dist-api-url: OK (${f}) contiene ${NEEDLE}`);
  } else {
    console.error(`verify-dist-api-url: FALTA "${NEEDLE}" en ${f}`);
  }
}

if (okCount !== files.length) {
  console.error(
    `verify-dist-api-url: solo ${okCount}/${files.length} bundles coinciden. Revisa .env.production y vuelve a npm run build.`,
  );
  process.exit(1);
}

console.log(
  'verify-dist-api-url: IA por servidor: no hace falta VITE_GEMINI_API_KEY si GEMINI_API_KEY está en el mismo backend que esta URL.',
);
