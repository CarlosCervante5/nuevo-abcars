/**
 * Fondo de catálogo fijo (ciclorama). No se genera con IA en cada foto:
 * se usa un JPG maestro (Cloudinary) o la plantilla SVG local.
 */

/** Ruta bajo `src/assets` (Angular la sirve como `/assets/...` con base href por defecto). */
export const STUDIO_CATALOG_BACKGROUND_ASSET = 'assets/catalog/studio-cyclorama-background.svg';

export const STUDIO_CATALOG_DEFAULT_WIDTH = 2048;
export const STUDIO_CATALOG_DEFAULT_HEIGHT = 1536;

/** Colores principales del SVG (referencia visual). */
export const STUDIO_CATALOG_COLOR_HINT =
  'Ciclorama neutro continuo en TODO el encuadre (no solo el suelo): pared superior ~#fafbfc, horizonte ~#e4e8ec, suelo ~#e8ebef a #f2f4f7, sin texturas ni objetos.';

function resolveAssetUrl(relativePath: string): string {
  const base = document.querySelector('base')?.href?.replace(/\/?$/, '') ?? '';
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${base}${path}`;
}

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
  return loadImageFromSrc(resolveAssetUrl(STUDIO_CATALOG_BACKGROUND_ASSET));
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
