#!/usr/bin/env node
/**
 * Falla el build si el bundle de producción no incluye la URL base esperada del sandbox.
 * Evita `cap sync` con un dist viejo o mal configurado.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const DIST_ASSETS = join(process.cwd(), 'dist', 'assets');
const NEEDLE = 'https://nuevo-abcars-sandbox.up.railway.app/api';

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
    console.log(`verify-dist-api-url: OK (${f}).`);
  } else {
    console.error(`verify-dist-api-url: FALTA ${NEEDLE} en ${f}`);
  }
}

if (okCount !== files.length) {
  console.error(
    `verify-dist-api-url: solo ${okCount}/${files.length} bundles incluyen la URL del sandbox.`,
  );
  process.exit(1);
}
