/**
 * Fondo de catálogo fijo (ciclorama). No se genera con IA: es un asset en `src/assets/catalog/`.
 * Úsalo para componer un vehículo con canal alpha encima y evitar tokens de “inventar” el estudio.
 */

/** Ruta bajo `src/assets` (Angular la sirve como `/assets/...` con base href por defecto). */
export const STUDIO_CATALOG_BACKGROUND_ASSET = 'assets/catalog/studio-cyclorama-background.svg';

/** Colores principales del SVG (para alinear prompts de Gemini si sigues usando IA). */
export const STUDIO_CATALOG_COLOR_HINT =
  'Ciclorama neutro: pared superior ~#fafbfc, horizonte ~#e4e8ec, suelo ~#e8ebef a #f2f4f7, sin texturas ni objetos.';

function resolveAssetUrl(relativePath: string): string {
  const base = document.querySelector('base')?.href?.replace(/\/?$/, '') ?? '';
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${base}${path}`;
}

/** Carga el fondo fijo como `HTMLImageElement` (útil para Canvas). */
export function loadStudioCatalogBackgroundImage(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`No se pudo cargar el fondo: ${STUDIO_CATALOG_BACKGROUND_ASSET}`));
    img.src = resolveAssetUrl(STUDIO_CATALOG_BACKGROUND_ASSET);
  });
}

export type CompositeOverStudioOptions = {
  /** Ancho de salida (por defecto 2048, coherente con el SVG). */
  width?: number;
  /** Alto de salida (por defecto 1536, 4:3). */
  height?: number;
  /** Formato de salida. */
  mime?: 'image/jpeg' | 'image/png';
  /** Calidad JPEG 0–1 (solo si mime es jpeg). */
  jpegQuality?: number;
};

/**
 * Dibuja el fondo fijo y encima una imagen (idealmente PNG con transparencia).
 * Si la imagen de entrada es opaca (p. ej. salida actual de Gemini), cubrirá todo el fondo.
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
    new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.decoding = 'async';
      im.crossOrigin = 'anonymous';
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('No se pudo cargar la imagen frontal'));
      im.src = foregroundDataUrl;
    }),
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
