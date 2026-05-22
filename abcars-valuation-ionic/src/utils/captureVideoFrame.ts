/**
 * Captura un frame del <video> respetando la orientación de la pantalla.
 * En móvil vertical el sensor suele entregar buffer apaisado (ancho > alto);
 * se rota solo en ese caso para que el JPEG coincida con lo que ve el usuario.
 */
export function captureVideoFrame(video: HTMLVideoElement, quality = 0.9): Promise<Blob> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) {
    return Promise.reject(new Error('La cámara aún no está lista'));
  }

  const screenPortrait = window.innerHeight > window.innerWidth;
  const sensorLandscape = vw > vh;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.reject(new Error('No se pudo crear el canvas'));
  }

  if (screenPortrait && sensorLandscape) {
    canvas.width = vh;
    canvas.height = vw;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(video, -vw / 2, -vh / 2, vw, vh);
  } else if (!screenPortrait && vh > vw) {
    canvas.width = vh;
    canvas.height = vw;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(video, -vw / 2, -vh / 2, vw, vh);
  } else {
    canvas.width = vw;
    canvas.height = vh;
    ctx.drawImage(video, 0, 0, vw, vh);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen'))),
      'image/jpeg',
      quality,
    );
  });
}
