/**
 * Descarga una imagen por URL para enviarla a Gemini u otros procesos (requiere CORS en el origen).
 */
export async function fetchImageAsFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
  if (!res.ok) {
    throw new Error(`No se pudo descargar la imagen (HTTP ${res.status}).`);
  }
  const blob = await res.blob();
  const type = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  const base = filename.replace(/\.[^/.]+$/, '') || 'imagen';
  const ext =
    type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `${base}.${ext}`, { type });
}
