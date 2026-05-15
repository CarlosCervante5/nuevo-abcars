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
  IonLoading,
  IonToast,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonToggle,
  IonNote,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  cameraOutline,
  imageOutline,
  trashOutline,
  informationCircle,
  flashOutline,
} from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle, VehicleImage } from '../../models/Vehicle';
import { cameraHelper, CameraImage } from '../../utils/camera';
import { geminiVehicleImageService } from '../../services/geminiVehicleImageService';
import { fetchImageAsFile } from '../../utils/fetchImageAsFile';
import CameraWithGuide from '../../components/CameraWithGuide';
import PhotoGuideModal from '../../components/PhotoGuideModal';
import PhotoTypeSelector, { PhotoGuideType } from '../../components/PhotoTypeSelector';
import './VehiclePhotos.css';

const VehiclePhotos: React.FC = () => {
  const { vehicleUuid } = useParams<{ vehicleUuid: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [newImages, setNewImages] = useState<CameraImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showCameraGuide, setShowCameraGuide] = useState(false);
  const [showPhotoGuide, setShowPhotoGuide] = useState(false);
  const [showPhotoTypeSelector, setShowPhotoTypeSelector] = useState(false);
  const [selectedPhotoType, setSelectedPhotoType] = useState<PhotoGuideType | 'car'>('car');
  const [selectedPhotoTitle, setSelectedPhotoTitle] = useState<string>('');
  const [processNewWithAi, setProcessNewWithAi] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [iaProgress, setIaProgress] = useState<{ cur: number; tot: number } | null>(null);
  const [processingImageUuid, setProcessingImageUuid] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    geminiVehicleImageService.isGenerationAvailable().then((ok) => {
      if (!cancelled) {
        setGeminiConfigured(ok);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useIonViewWillEnter(() => {
    geminiVehicleImageService.refreshGenerationAvailability().then(setGeminiConfigured);
  });

  useEffect(() => {
    if (vehicleUuid) {
      loadVehicle();
    }
  }, [vehicleUuid]);

  const loadVehicle = async () => {
    if (!vehicleUuid) return;

    try {
      setLoading(true);
      const response = await vehicleService.getVehicleDetail(vehicleUuid);
      if (response.status === 200 && response.data) {
        setVehicle(response.data);
        const raw = response.data.images || [];
        setImages([...raw].sort((a, b) => Number(a.sort_id) - Number(b.sort_id)));
        geminiVehicleImageService.refreshGenerationAvailability().then(setGeminiConfigured);
      }
    } catch {
      setToastMessage('Error al cargar el vehículo');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = () => {
    setShowPhotoTypeSelector(true);
  };

  const handlePhotoTypeSelected = (type: PhotoGuideType, title: string) => {
    setSelectedPhotoType(type);
    setSelectedPhotoTitle(title);
    setShowCameraGuide(true);
  };

  const handlePhotoTaken = (image: CameraImage) => {
    if (image && image.file) {
      setNewImages((prev) => [...prev, image]);
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const image = await cameraHelper.takePhoto('gallery');
      if (image && image.file) {
        setNewImages((prev) => [...prev, image]);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg !== 'User cancelled photos app') {
        setToastMessage('Error al seleccionar foto');
        setShowToast(true);
      }
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadImages = async () => {
    if (!vehicleUuid || newImages.length === 0) return;

    const rawFiles = newImages.map((img) => img.file).filter((f): f is File => f !== null);

    if (processNewWithAi && !geminiConfigured) {
      setToastMessage(
        'IA no disponible. Configura GEMINI_API_KEY en el servidor o VITE_GEMINI_API_KEY en el build, o desactiva el interruptor.',
      );
      setShowToast(true);
      return;
    }

    try {
      setUploading(true);
      setIaProgress(null);

      let filesToSend = rawFiles;
      if (processNewWithAi) {
        setIaProgress({ cur: 0, tot: rawFiles.length });
        filesToSend = await geminiVehicleImageService.processFilesRecorteEmbellecer(
          rawFiles,
          (cur, tot) => setIaProgress({ cur, tot }),
        );
        setIaProgress(null);
      }

      await vehicleService.uploadVehicleImages(vehicleUuid, filesToSend);

      setToastMessage(
        processNewWithAi ? 'Fotos procesadas con IA y subidas' : 'Fotos subidas correctamente',
      );
      setShowToast(true);
      setNewImages([]);
      await loadVehicle();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al procesar o subir fotos';
      setToastMessage(msg);
      setShowToast(true);
    } finally {
      setUploading(false);
      setIaProgress(null);
    }
  };

  const handleProcessExistingWithAi = async (image: VehicleImage, index: number) => {
    if (!vehicleUuid || processingImageUuid) return;
    if (!geminiConfigured) {
      setToastMessage('IA no disponible (clave en servidor o en el build de la app).');
      setShowToast(true);
      return;
    }

    const remoteUrl = image.service_image_url || image.image_path || '';
    if (!remoteUrl) {
      setToastMessage('Esta imagen no tiene URL válida');
      setShowToast(true);
      return;
    }

    const ok = window.confirm(
      '¿Procesar esta foto con IA?\n\nSe enviará a Gemini (ciclorama estudio ABCars) y sustituirá la imagen actual en esta posición.',
    );
    if (!ok) return;

    try {
      setProcessingImageUuid(image.uuid);
      const source = await fetchImageAsFile(remoteUrl, `source_${image.uuid}.jpg`);
      const processed = await geminiVehicleImageService.processFilesRecorteEmbellecer([source]);
      const outFile = processed[0];
      if (!outFile) {
        throw new Error('La IA no devolvió imagen.');
      }
      const res = await vehicleService.replaceGalleryImageAtIndex(
        vehicleUuid,
        image.uuid,
        index,
        outFile,
      );
      if (res.status === 200 && res.data) {
        const raw = res.data.images || [];
        setImages([...raw].sort((a, b) => Number(a.sort_id) - Number(b.sort_id)));
        setVehicle(res.data);
      }
      setToastMessage('Imagen procesada con IA y actualizada');
      setShowToast(true);
      await loadVehicle();
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : 'No se pudo procesar. Revisa sesión y permisos del servidor.';
      setToastMessage(msg);
      setShowToast(true);
    } finally {
      setProcessingImageUuid(null);
    }
  };

  const handleDeleteImage = async (imageUuid: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta imagen?')) return;

    try {
      await vehicleService.deleteVehicleImage(imageUuid);
      setToastMessage('Imagen eliminada correctamente');
      setShowToast(true);
      await loadVehicle();
    } catch {
      setToastMessage('Error al eliminar imagen');
      setShowToast(true);
    }
  };

  const loadingMessage =
    iaProgress && iaProgress.tot > 0
      ? `Procesando con IA… ${iaProgress.cur}/${iaProgress.tot}`
      : uploading
        ? 'Subiendo fotos…'
        : 'Cargando fotos…';

  const busyExisting = Boolean(processingImageUuid);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/manager/vehicles/${vehicleUuid}`} />
          </IonButtons>
          <IonTitle>Fotos del Vehículo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonLoading isOpen={loading && !uploading} message="Cargando fotos..." />

        <div className="vehicle-photos-container">
          <h2 className="photos-section-title">
            {vehicle?.brand?.name} {vehicle?.model?.name}
          </h2>

          <IonCard className="ia-info-card">
            <IonCardContent>
              <IonItem lines="none">
                <IonToggle
                  checked={processNewWithAi}
                  disabled={!geminiConfigured || uploading}
                  onIonChange={(e) => setProcessNewWithAi(Boolean(e.detail.checked))}
                >
                  <IonLabel>
                    <strong>IA antes de subir nuevas fotos</strong>
                    <p>Ciclorama estudio ABCars con Gemini (una petición por foto).</p>
                  </IonLabel>
                </IonToggle>
              </IonItem>
              {!geminiConfigured && (
                <IonNote className="ia-note">
                  Si el servidor ya tiene clave Gemini y sigues sin IA: despliega el backend actualizado, permisos de
                  fotos (crear/actualizar vehículo) y vuelve a abrir esta pantalla.
                </IonNote>
              )}
            </IonCardContent>
          </IonCard>

          {images.length > 0 && (
            <div className="existing-photos-section">
              <h3 className="photos-subtitle">Fotos existentes</h3>
              <p className="photos-hint-existing">
                Rayo: reprocesar con IA y sustituir (usa proxy del servidor para CDN).
              </p>
              <IonGrid>
                <IonRow>
                  {images.map((image, idx) => (
                    <IonCol size="6" sizeMd="4" key={image.uuid}>
                      <div className="photo-item">
                        <img
                          src={image.service_image_url || image.image_path}
                          alt={`Foto ${image.sort_id}`}
                          className="photo-image"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTdlOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
                          }}
                        />
                        <IonButton
                          fill="solid"
                          color="warning"
                          size="small"
                          className="photo-ia-btn"
                          disabled={
                            !geminiConfigured ||
                            uploading ||
                            busyExisting ||
                            processingImageUuid === image.uuid
                          }
                          onClick={() => handleProcessExistingWithAi(image, idx)}
                        >
                          <IonIcon icon={flashOutline} slot="icon-only" />
                        </IonButton>
                        <IonButton
                          fill="clear"
                          color="danger"
                          size="small"
                          onClick={() => handleDeleteImage(image.uuid)}
                          className="photo-delete-btn"
                          disabled={uploading || busyExisting}
                        >
                          <IonIcon icon={trashOutline} />
                        </IonButton>
                      </div>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            </div>
          )}

          <div className="new-photos-section">
            <div className="photos-subtitle-container">
              <h3 className="photos-subtitle">Nuevas fotos</h3>
              <IonButton
                fill="clear"
                size="small"
                onClick={() => setShowPhotoGuide(true)}
                className="guide-button"
              >
                <IonIcon icon={informationCircle} slot="start" />
                Ver guía
              </IonButton>
            </div>
            <div className="photo-actions">
              <IonButton
                expand="block"
                fill="outline"
                onClick={handleTakePhoto}
                disabled={uploading}
              >
                <IonIcon icon={cameraOutline} slot="start" />
                Tomar foto
              </IonButton>
              <IonButton
                expand="block"
                fill="outline"
                onClick={handleSelectFromGallery}
                disabled={uploading}
              >
                <IonIcon icon={imageOutline} slot="start" />
                Galería
              </IonButton>
            </div>

            {newImages.length > 0 && (
              <>
                <IonGrid>
                  <IonRow>
                    {newImages.map((image, index) => (
                      <IonCol size="6" sizeMd="4" key={index}>
                        <div className="photo-item">
                          <img
                            src={image.webPath}
                            alt={`Nueva foto ${index + 1}`}
                            className="photo-image"
                          />
                          <IonButton
                            fill="clear"
                            color="danger"
                            size="small"
                            onClick={() => handleRemoveNewImage(index)}
                            className="photo-delete-btn"
                            disabled={uploading}
                          >
                            <IonIcon icon={trashOutline} />
                          </IonButton>
                        </div>
                      </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>

                <IonButton
                  expand="block"
                  fill="solid"
                  color="success"
                  onClick={handleUploadImages}
                  disabled={uploading}
                  className="upload-button"
                >
                  {uploading
                    ? processNewWithAi
                      ? 'Procesando / subiendo…'
                      : 'Subiendo…'
                    : processNewWithAi
                      ? `Subir ${newImages.length} foto(s) con IA`
                      : `Subir ${newImages.length} foto(s)`}
                </IonButton>
              </>
            )}
          </div>
        </div>

        <IonLoading isOpen={uploading} message={loadingMessage} />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={4000}
          position="top"
        />

        <PhotoTypeSelector
          isOpen={showPhotoTypeSelector}
          onClose={() => setShowPhotoTypeSelector(false)}
          onSelect={handlePhotoTypeSelected}
        />

        <CameraWithGuide
          isOpen={showCameraGuide}
          onClose={() => {
            setShowCameraGuide(false);
            setSelectedPhotoType('car');
            setSelectedPhotoTitle('');
          }}
          onPhotoTaken={handlePhotoTaken}
          guideType={selectedPhotoType}
          photoTitle={selectedPhotoTitle}
        />

        <PhotoGuideModal
          isOpen={showPhotoGuide}
          onClose={() => setShowPhotoGuide(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default VehiclePhotos;

