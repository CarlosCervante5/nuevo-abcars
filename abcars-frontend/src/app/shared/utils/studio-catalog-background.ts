/**
 * Fondo de catálogo (ciclorama): referencia para prompts de Gemini y composición opcional en canvas.
 * El ciclorama en fotos de inventario lo genera de nuevo el modelo en una sola pasada (prompt fijo).
 */

const STUDIO_CATALOG_BACKGROUND_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1536" viewBox="0 0 2048 1536" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="abc-wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fafbfc"/>
      <stop offset="42%" stop-color="#eef1f4"/>
      <stop offset="72%" stop-color="#e4e8ec"/>
      <stop offset="100%" stop-color="#dde2e8"/>
    </linearGradient>
    <linearGradient id="abc-floor" x1="0" y1="0.62" x2="0" y2="1">
      <stop offset="0%" stop-color="#dce1e6"/>
      <stop offset="35%" stop-color="#e8ebef"/>
      <stop offset="100%" stop-color="#f2f4f7"/>
    </linearGradient>
    <radialGradient id="abc-vignette" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="78%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#c5ccd4" stop-opacity="0.12"/>
    </radialGradient>
    <radialGradient id="abc-contact" cx="50%" cy="92%" r="45%">
      <stop offset="0%" stop-color="#b8c0ca" stop-opacity="0.22"/>
      <stop offset="50%" stop-color="#d5dae0" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#e8ebef" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="2048" height="1536" fill="url(#abc-wall)"/>
  <rect x="0" y="952" width="2048" height="584" fill="url(#abc-floor)"/>
  <path fill="#e2e6eb" d="M0 900 C 340 820, 708 800, 1024 812 C 1340 824, 1708 848, 2048 900 L 2048 952 L 0 952 Z" opacity="0.55"/>
  <rect width="2048" height="1536" fill="url(#abc-vignette)"/>
  <rect width="2048" height="1536" fill="url(#abc-contact)"/>
</svg>`;

function studioCatalogBackgroundDataUrl(): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(STUDIO_CATALOG_BACKGROUND_SVG)}`;
}

/** Referencia a asset estático (opcional); el runtime usa SVG embebido para evitar 404 en deploy. */
export const STUDIO_CATALOG_BACKGROUND_ASSET = 'assets/catalog/studio-cyclorama-background.svg';

/** Texto del prompt fijo de Gemini (recorte + ciclorama en una sola imagen). */
export const STUDIO_CATALOG_COLOR_HINT =
  'Ciclorama neutro continuo en TODO el encuadre (no solo el suelo): pared superior ~#fafbfc, horizonte ~#e4e8ec, suelo ~#e8ebef a #f2f4f7, sin texturas ni objetos. Prohibido conservar techo, luces, columnas, cielo o cualquier resto del local original, aunque esté difuminado.';

export type CompositeOverStudioOptions = {
  width?: number;
  height?: number;
  mime?: 'image/jpeg' | 'image/png';
  jpegQuality?: number;
};

/** Carga la plantilla de ciclorama embebida (canvas / herramientas internas). */
export function loadStudioCatalogBackgroundImage(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la plantilla de ciclorama'));
    img.src = studioCatalogBackgroundDataUrl();
  });
}

function loadForegroundForComposite(src: string): Promise<HTMLImageElement> {
  const isData = src.trimStart().toLowerCase().startsWith('data:');
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.decoding = 'async';
    if (!isData) {
      im.crossOrigin = 'anonymous';
    }
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('No se pudo cargar la imagen frontal'));
    im.src = src;
  });
}

/**
 * Composición opcional: fondo embebido + capa frontal (p. ej. PNG con alpha).
 * Si la frontal es opaca, cubrirá el fondo.
 */
export async function compositeDataUrlOverStudioBackground(
  foregroundDataUrl: string,
  options: CompositeOverStudioOptions = {},
): Promise<Blob> {
  const width = options.width ?? 2048;
  const height = options.height ?? 1536;
  const mime = options.mime ?? 'image/jpeg';
  const jpegQuality = options.jpegQuality ?? 0.92;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D no disponible');
  }

  const [bg, fg] = await Promise.all([
    loadStudioCatalogBackgroundImage(),
    loadForegroundForComposite(foregroundDataUrl.trim()),
  ]);

  ctx.drawImage(bg, 0, 0, width, height);
  ctx.drawImage(fg, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob falló'))),
      mime,
      mime === 'image/jpeg' ? jpegQuality : undefined,
    );
  });
}
