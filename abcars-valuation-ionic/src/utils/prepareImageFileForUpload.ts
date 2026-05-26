/** Evita JSON > ~1 MB en el bridge Capacitor (UnknownHostException). Backend max ~10 MB. */
const MAX_UPLOAD_BYTES = 380 * 1024;
const MAX_DIMENSION = 1920;

/**
 * Asegura JPEG y tamaño dentro del límite del servidor (evita 422 por max/tipo).
 */
export async function prepareImageFileForUpload(file: File): Promise<File> {
  const name = file.name?.match(/\.(jpe?g|png|webp)$/i)
    ? file.name.replace(/\.(png|webp)$/i, '.jpg')
    : `photo_${Date.now()}.jpg`;

  if (file.size <= MAX_UPLOAD_BYTES && file.type === 'image/jpeg') {
    return file.name === name ? file : new File([file], name, { type: 'image/jpeg' });
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('No se pudo leer la imagen'));
      el.src = url;
    });

    let { width, height } = img;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height, 1));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return new File([file], name, { type: file.type || 'image/jpeg' });
    }
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.88;
    let blob: Blob | null = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', quality),
      );
      if (!blob) break;
      if (blob.size <= MAX_UPLOAD_BYTES) break;
      quality = Math.max(0.52, quality - 0.06);
    }

    if (!blob) {
      return new File([file], name, { type: file.type || 'image/jpeg' });
    }
    return new File([blob], name, { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(url);
  }
}
