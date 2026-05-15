/**
 * Ciclorama ABCars (alineado con abcars-frontend studio-catalog-background + gemini-vehicle-image).
 */

export const STUDIO_CATALOG_BACKDROP_TOP_HEX = '#fafbfc';
export const STUDIO_CATALOG_BACKDROP_HORIZON_HEX = '#e4e8ec';
export const STUDIO_CATALOG_FLOOR_UNDER_VEHICLE_HEX = '#e8ebef';
export const STUDIO_CATALOG_FLOOR_FOREGROUND_HEX = '#f2f4f7';

export const STUDIO_CATALOG_HEX_SPEC_EN =
  `Mandatory fixed studio palette (match these hex values everywhere outside the vehicle): ` +
  `backdrop/wall upper region ${STUDIO_CATALOG_BACKDROP_TOP_HEX}, blending to ${STUDIO_CATALOG_BACKDROP_HORIZON_HEX} at the cyclorama horizon/curve; ` +
  `floor matte ${STUDIO_CATALOG_FLOOR_UNDER_VEHICLE_HEX} under the tires, blending to ${STUDIO_CATALOG_FLOOR_FOREGROUND_HEX} toward the foreground. ` +
  `No medium-gray or dark-gray studio; no glossy showroom mirror floor.`;

export const STUDIO_CATALOG_COLOR_HINT =
  `Ciclorama continuo en todo el encuadre con paleta FIJA ABCars: detrás del vehículo (pared del estudio) ${STUDIO_CATALOG_BACKDROP_TOP_HEX} arriba degradando suavemente a ${STUDIO_CATALOG_BACKDROP_HORIZON_HEX} en el horizonte del curvado; ` +
  `piso mate ${STUDIO_CATALOG_FLOOR_UNDER_VEHICLE_HEX} bajo el auto hasta ${STUDIO_CATALOG_FLOOR_FOREGROUND_HEX} en primer plano. ` +
  `Usar exactamente estos hex (no sustituir por otros grises). Sin texturas, rejillas ni objetos. ` +
  `Prohibido conservar techo, luces, columnas, cielo o cualquier resto del local original, aunque esté difuminado.`;

export const PROMPT_RECORTE_ES = `Recorte y fondo: detecta el vehículo principal, recorta y aísla el auto. Elimina por completo el entorno original (techo, paredes, columnas, suelo viejo, cielo, árboles, carteles): no lo dejes difuminado ni en una franja superior. Sustituye el 100% del fondo por el estudio de catálogo ABCars, un solo ciclorama continuo (${STUDIO_CATALOG_COLOR_HINT}). Embellece: suciedad leve, reflejos equilibrados, acabado premium. Mantén la identidad exacta del coche (modelo, proporciones, llantas, emblemas).`;

export const STUDIO_RECORTE_SUFFIX_EN =
  `[Technical output requirement] ${STUDIO_CATALOG_HEX_SPEC_EN} ` +
  `Full-frame cyclorama only: every pixel outside the vehicle silhouette must use only this fixed palette—no visible original environment ` +
  `(no blurred ceiling, lights, pillars, showroom, sky, or horizon from the source photo). ` +
  `No horizontal “blend band” between old scene and studio. Seamless wall-to-floor curve only. ` +
  `Tight framing around the vehicle with consistent margins. Subtle beautify: dirt reduction, balanced reflections, catalog finish. ` +
  `Do NOT change vehicle identity, geometry, badges, wheels, or proportions. Photorealistic edges and a soft natural contact shadow on the new floor.`;

export function buildRecortePrompt(): string {
  return `${PROMPT_RECORTE_ES.trim()}\n\n${STUDIO_RECORTE_SUFFIX_EN}`;
}
