import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonLoading,
  IonToast,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { cameraOutline, imageOutline, checkmarkCircle } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { valuationService } from '../../services/valuationService';
import { cameraHelper, CameraImage } from '../../utils/camera';
import './Photos.css';
import { getApiBaseUrl, getAssetBaseUrl } from '../../config/apiBaseUrl';

interface PhotoItem {
  index: number;
  name: string;
  image: CameraImage | null;
  uploaded: boolean;
  existingUrl?: string;
}

const API_BASE_URL = getApiBaseUrl();
const ASSET_BASE_URL = getAssetBaseUrl();

const INTERIOR_PHOTOS = [
  { index: 0, name: 'Consola' },
  { index: 1, name: 'Asiento trasero' },
  { index: 2, name: 'Asiento delantero' },
  { index: 3, name: 'Luces' },
  { index: 4, name: 'Toma corriente' },
  { index: 5, name: 'Computadora de viaje' },
  { index: 6, name: 'Tacómetro' },
  { index: 7, name: 'Quemacocos' },
  { index: 8, name: 'Cinturones' },
  { index: 9, name: 'Hoja de servicios' },
];

const InternalPhotos: React.FC = () => {
  const { valuationUuid } = useParams<{ valuationUuid: string }>();
  const [photos, setPhotos] = useState<PhotoItem[]>(
    INTERIOR_PHOTOS.map((p) => ({ ...p, image: null, uploaded: false }))
  );
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (valuationUuid) {
      loadExistingPhotos();
    }
  }, [valuationUuid]);

  const loadExistingPhotos = async () => {
    if (!valuationUuid) return;

    try {
      setLoading(true);
      const response = await valuationService.searchImages(valuationUuid, 'interior');
      
      if (response.status === 200 && response.data) {
        const nameToIndex: Record<string, number> = {
          'Consola': 0,
          'Asiento trasero': 1,
          'Asiento delantero': 2,
          'Luces': 3,
          'Toma corriente': 4,
          'Computadora de viaje': 5,
          'Tacómetro': 6,
          'Quemacocos': 7,
          'Cinturones': 8,
          'Hoja de servicios': 9,
        };

        response.data.forEach((item: any) => {
          const index = nameToIndex[item.name];
          if (index !== undefined) {
            const rawPath = item.image_path || '';
            const fullPath = rawPath.startsWith('http')
              ? rawPath
              : `${ASSET_BASE_URL}${rawPath.replace(/^\//, '')}`;
            setPhotos((prev) =>
              prev.map((p) =>
                p.index === index
                  ? { ...p, existingUrl: fullPath, uploaded: true }
                  : p
              )
            );
          }
        });
      }
    } catch (error: any) {
      console.error('Error al cargar fotos existentes:', error);
      // No mostrar error si simplemente no hay fotos
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async (index: number) => {
    try {
      const image = await cameraHelper.takePhoto('camera');
      if (!image || !image.file) return;

      setPhotos((prev) =>
        prev.map((p) => (p.index === index ? { ...p, image, uploaded: false } : p))
      );
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        setToastMessage('Error al capturar foto');
        setShowToast(true);
      }
    }
  };

  const handleSelectFromGallery = async (index: number) => {
    try {
      const image = await cameraHelper.takePhoto('gallery');
      if (!image || !image.file) return;

      setPhotos((prev) =>
        prev.map((p) => (p.index === index ? { ...p, image, uploaded: false } : p))
      );
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        setToastMessage('Error al seleccionar foto');
        setShowToast(true);
      }
    }
  };

  const handleUploadPhoto = async (index: number) => {
    if (!valuationUuid) return;

    const photo = photos.find((p) => p.index === index);
    if (!photo || !photo.image || !photo.image.file) return;

    try {
      setUploading((prev) => ({ ...prev, [index]: true }));

      const res = await valuationService.uploadImage(
        valuationUuid,
        photo.name,
        photo.image.file,
        'Interior'
      );

      setPhotos((prev) =>
        prev.map((p) => (p.index === index ? { ...p, uploaded: true } : p))
      );

      setToastMessage((res as any)?.message || `${photo.name} subida correctamente`);
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(`Error al subir ${photo.name}`);
      setShowToast(true);
    } finally {
      setUploading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) =>
      prev.map((p) => (p.index === index ? { ...p, image: null, uploaded: false } : p))
    );
  };

  const allPhotosUploaded = photos.every((p) => p.uploaded || p.existingUrl);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/valuations/${valuationUuid}/checklist`} />
          </IonButtons>
          <IonTitle>Fotos Interiores</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonLoading isOpen={loading} message="Cargando fotos..." />

        <div className="photos-container">
          <h2 className="photos-section-title">Fotos Principales</h2>
          <p className="photos-section-subtitle">
            Sube las 10 fotos principales del interior
          </p>

          <IonGrid>
            <IonRow>
              {photos.map((photo) => (
                <IonCol size="6" sizeMd="4" key={photo.index}>
                  <IonCard className="photo-card">
                    <IonCardHeader>
                      <IonCardTitle className="photo-card-title">{photo.name}</IonCardTitle>
                      {(photo.uploaded || photo.existingUrl) && (
                        <IonIcon icon={checkmarkCircle} color="success" className="photo-check-icon" />
                      )}
                    </IonCardHeader>
                    <IonCardContent>
                      {photo.image ? (
                        <div className="photo-preview-wrapper">
                          <img
                            src={photo.image.webPath}
                            alt={photo.name}
                            className="photo-preview-image"
                          />
                          <div className="photo-actions-overlay">
                            {!photo.uploaded && (
                              <IonButton
                                size="small"
                                fill="solid"
                                color="success"
                                onClick={() => handleUploadPhoto(photo.index)}
                                disabled={uploading[photo.index]}
                              >
                                {uploading[photo.index] ? 'Subiendo...' : 'Subir'}
                              </IonButton>
                            )}
                            <IonButton
                              size="small"
                              fill="clear"
                              color="danger"
                              onClick={() => handleRemovePhoto(photo.index)}
                              disabled={uploading[photo.index]}
                            >
                              Quitar
                            </IonButton>
                          </div>
                        </div>
                      ) : photo.existingUrl ? (
                        <div className="photo-preview-wrapper">
                          <img
                            src={photo.existingUrl}
                            alt={photo.name}
                            className="photo-preview-image"
                          />
                        </div>
                      ) : (
                        <div className="photo-placeholder">
                          <IonButton
                            fill="outline"
                            expand="block"
                            onClick={() => handleTakePhoto(photo.index)}
                            className="photo-action-button"
                          >
                            <IonIcon icon={cameraOutline} slot="start" />
                            Tomar Foto
                          </IonButton>
                          <IonButton
                            fill="outline"
                            expand="block"
                            onClick={() => handleSelectFromGallery(photo.index)}
                            className="photo-action-button"
                          >
                            <IonIcon icon={imageOutline} slot="start" />
                            Galería
                          </IonButton>
                        </div>
                      )}
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>

          {allPhotosUploaded && (
            <div className="photos-complete-message">
              <IonIcon icon={checkmarkCircle} color="success" size="large" />
              <p>Todas las fotos principales han sido subidas</p>
            </div>
          )}
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default InternalPhotos;

