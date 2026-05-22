import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface CameraImage {
  webPath: string;
  base64?: string;
  file?: File;
  guideType?: string;
  guideTitle?: string;
}

/**
 * Helper para capturar imágenes usando Capacitor Camera
 */
export const cameraHelper = {
  /**
   * Captura una foto usando la cámara o galería
   */
  async takePhoto(source: 'camera' | 'gallery' = 'camera'): Promise<CameraImage | null> {
    try {
      const permissions = await Camera.requestPermissions({
        permissions: source === 'camera' ? ['camera', 'photos'] : ['photos'],
      });
      if (source === 'camera' && permissions.camera === 'denied') {
        throw new Error('Permiso de cámara denegado.');
      }
      if (permissions.photos === 'denied') {
        throw new Error('Permiso de fotos denegado.');
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        correctOrientation: true,
      });

      if (!image.webPath) {
        return null;
      }

      // Convertir URI a File para poder subirlo
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

      return {
        webPath: image.webPath,
        file,
      };
    } catch (error: any) {
      console.error('Error al capturar imagen:', error);
      if (error.message !== 'User cancelled photos app') {
        throw new Error(error.message || 'Error al capturar imagen. Por favor intenta de nuevo.');
      }
      return null;
    }
  },

  /**
   * Captura múltiples fotos
   */
  async takeMultiplePhotos(count: number = 5): Promise<CameraImage[]> {
    const images: CameraImage[] = [];
    
    for (let i = 0; i < count; i++) {
      const image = await this.takePhoto();
      if (image) {
        images.push(image);
      } else {
        break; // Usuario canceló
      }
    }

    return images;
  },
};

