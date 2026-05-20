/**
 * @capacitor-community/http no tiene Package.swift válido para SPM (fuentes mixtas ObjC/Swift).
 * En iOS la app usa el adaptador HTTP nativo solo en Android; aquí quitamos el plugin del grafo SPM.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../ios/App/CapApp-SPM/Package.swift',
);

let src = readFileSync(pkgPath, 'utf8');
const before = src;

src = src
  .replace(
    /\s*\.package\(name: "CapacitorCommunityHttp", path: "[^"]+"\),?\n/g,
    '\n',
  )
  .replace(
    /\s*\.product\(name: "CapacitorCommunityHttp", package: "CapacitorCommunityHttp"\),?\n/g,
    '\n',
  );

if (src === before) {
  console.warn('[patch-ios-spm-without-http] No se encontraron referencias a CapacitorCommunityHttp.');
} else {
  writeFileSync(pkgPath, src);
  console.log('[patch-ios-spm-without-http] CapacitorCommunityHttp eliminado de CapApp-SPM.');
}
