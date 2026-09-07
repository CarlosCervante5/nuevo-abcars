/**
 * Tras `cap sync ios`, asegura que el target sea solo iPhone (sin iPad).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pbxPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../ios/App/App.xcodeproj/project.pbxproj',
);

let src = readFileSync(pbxPath, 'utf8');
const before = src;

src = src.replace(/TARGETED_DEVICE_FAMILY = "1,2";/g, 'TARGETED_DEVICE_FAMILY = 1;');
src = src.replace(/TARGETED_DEVICE_FAMILY = 2;/g, 'TARGETED_DEVICE_FAMILY = 1;');

for (const flag of ['SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD', 'SUPPORTS_XR_DESIGNED_FOR_IPHONE_IPAD']) {
  if (!src.includes(`${flag} = NO`)) {
    src = src.replace(
      /(TARGETED_DEVICE_FAMILY = 1;\n)/g,
      `$1\t\t\t\t${flag} = NO;\n`,
    );
  }
}

if (src !== before) {
  writeFileSync(pbxPath, src);
  console.log('[patch-ios-iphone-only] Target iOS configurado solo para iPhone.');
} else {
  console.log('[patch-ios-iphone-only] Ya estaba solo iPhone (TARGETED_DEVICE_FAMILY = 1).');
}
