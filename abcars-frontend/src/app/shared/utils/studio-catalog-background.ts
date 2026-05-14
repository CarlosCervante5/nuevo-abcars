/**
 * Fondo de catálogo fijo (ciclorama). No se genera con IA en cada foto:
 * se usa un JPG maestro (Cloudinary) o la plantilla SVG local.
 */

/**
 * Ciclorama embebido (no depende de `/assets/...` en el host).
 * Evita 404 en despliegues donde los estáticos no coinciden con la ruta esperada.
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

/** Ruta bajo `src/assets` (solo referencia; el runtime usa SVG embebido). */
export const STUDIO_CATALOG_BACKGROUND_ASSET = 'assets/catalog/studio-cyclorama-background.svg';

export const STUDIO_CATALOG_DEFAULT_WIDTH = 2048;
export const STUDIO_CATALOG_DEFAULT_HEIGHT = 1536;

/** Colores principales del SVG (referencia visual). */
export const STUDIO_CATALOG_COLOR_HINT =
  'Ciclorama neutro continuo en TODO el encuadre (no solo el suelo): pared superior ~#fafbfc, horizonte ~#e4e8ec, suelo ~#e8ebef a #f2f4f7, sin texturas ni objetos.';

function loadImageFromSrc(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    if (crossOrigin) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });
}

/** Carga el fondo fijo: URL maestra (Cloudinary) o plantilla SVG local. */
export async function loadStudioCatalogBackgroundImage(
  backgroundUrl?: string | null,
): Promise<HTMLImageElement> {
  if (backgroundUrl?.trim()) {
    return loadImageFromSrc(backgroundUrl.trim(), true);
  }
  return loadImageFromSrc(studioCatalogBackgroundDataUrl(), false);
}

export type CompositeOverStudioOptions = {
  backgroundUrl?: string | null;
  width?: number;
  height?: number;
  mime?: 'image/jpeg' | 'image/png';
  jpegQuality?: number;
};

/**
 * Rasteriza la plantilla SVG local a JPG (sin vehículo).
 */
export async function renderDefaultStudioBackgroundBlob(
  options: Omit<CompositeOverStudioOptions, 'backgroundUrl'> = {},
): Promise<Blob> {
  const width = options.width ?? STUDIO_CATALOG_DEFAULT_WIDTH;
  const height = options.height ?? STUDIO_CATALOG_DEFAULT_HEIGHT;
  const mime = options.mime ?? 'image/jpeg';
  const jpegQuality = options.jpegQuality ?? 0.92;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D no disponible');
  }

  const bg = await loadStudioCatalogBackgroundImage(null);
  ctx.drawImage(bg, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob falló'))),
      mime,
      mime === 'image/jpeg' ? jpegQuality : undefined,
    );
  });
}

/**
 * Dibuja el fondo maestro y encima el vehículo (idealmente PNG con transparencia).
 */
export async function compositeDataUrlOverStudioBackground(
  foregroundDataUrl: string,
  options: CompositeOverStudioOptions = {},
): Promise<Blob> {
  const width = options.width ?? STUDIO_CATALOG_DEFAULT_WIDTH;
  const height = options.height ?? STUDIO_CATALOG_DEFAULT_HEIGHT;
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
    loadStudioCatalogBackgroundImage(options.backgroundUrl),
    loadImageFromSrc(foregroundDataUrl, true),
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
