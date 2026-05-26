import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  IonSpinner,
  IonToast,
  IonAlert,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonToggle,
  IonNote,
  useIonViewWillEnter,
  useIonViewWillLeave,
} from '@ionic/react';
import {
  cameraOutline,
  imageOutline,
  trashOutline,
  informationCircle,
  flashOutline,
  chevronUpOutline,
  chevronDownOutline,
  layersOutline,
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
import { PHOTO_GUIDE_ENTRIES } from '../../config/photoGuideDefinitions';
import ImageLightbox from '../../components/ImageLightbox';
import BatchAiProcessModal from '../../components/BatchAiProcessModal';
import VehicleIaBatchBanner from '../../components/VehicleIaBatchBanner';
import {
  vehicleImageAiBatchService,
} from '../../services/vehicleImageAiBatchService';
import type { BatchImageTarget } from '../../services/vehicleImageAiBatch.types';
import { formatUploadError, logUploadDiagnostic } from '../../utils/apiErrorMessage';
import './VehiclePhotos.css';

function galleryUrl(image: VehicleImage): string {
  return image.service_image_url || image.image_path || '';
}

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
  const [captureSession, setCaptureSession] = useState<{ index: number } | null>(null);
  const [sessionAdvanceKey, setSessionAdvanceKey] = useState(0);
  const [processNewWithAi, setProcessNewWithAi] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [iaProgress, setIaProgress] = useState<{
    cur: number;
    tot: number;
    step?: 'ia' | 'upload';
  } | null>(null);
  const [processingImageUuid, setProcessingImageUuid] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showBatchAiModal, setShowBatchAiModal] = useState(false);
  const [uploadErrorAlert, setUploadErrorAlert] = useState<string | null>(null);

  const galleryUrls = useMemo(
    () => images.map(galleryUrl).filter((u) => Boolean(u)),
    [images],
  );

  const openLightboxAt = useCallback(
    (index: number) => {
      if (galleryUrls.length === 0) return;
      setLightboxIndex(Math.min(Math.max(0, index), galleryUrls.length - 1));
      setLightboxOpen(true);
    },
    [galleryUrls.length],
  );

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

  const hadBatchActiveRef = useRef(false);

  useIonViewWillEnter(() => {
    geminiVehicleImageService.refreshGenerationAvailability().then(setGeminiConfigured);
    hadBatchActiveRef.current = Boolean(
      vehicleUuid && vehicleImageAiBatchService.getJobForVehicle(vehicleUuid),
    );
  });

  useEffect(() => {
    return vehicleImageAiBatchService.subscribe(() => {
      if (!vehicleUuid) return;
      const active = Boolean(vehicleImageAiBatchService.getJobForVehicle(vehicleUuid));
      if (hadBatchActiveRef.current && !active) {
        loadVehicle({ blockUi: false });
        setNewImages([]);
      }
      hadBatchActiveRef.current = active;
    });
  }, [vehicleUuid]);

  useIonViewWillLeave(() => {
    setUploading(false);
    setLoading(false);
    setIaProgress(null);
    setProcessingImageUuid(null);
    setReordering(false);
    setShowCameraGuide(false);
    setShowPhotoTypeSelector(false);
    setCaptureSession(null);
    setSessionAdvanceKey(0);
    setLightboxOpen(false);
  });

  useEffect(() => {
    if (vehicleUuid) {
      loadVehicle();
    }
  }, [vehicleUuid]);

  const loadVehicle = async (options?: { blockUi?: boolean }) => {
    if (!vehicleUuid) return;

    const blockUi = options?.blockUi !== false;

    try {
      if (blockUi) {
        setLoading(true);
      }
      const response = await vehicleService.getVehicleDetail(vehicleUuid);
      if (response.status === 200 && response.data) {
        setVehicle(response.data);
        const raw = response.data.images || [];
        setImages([...raw].sort((a, b) => Number(a.sort_id) - Number(b.sort_id)));
        geminiVehicleImageService.refreshGenerationAvailability().then(setGeminiConfigured);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      const isNetwork =
        msg.includes('Network Error') ||
        msg.includes('ERR_NETWORK') ||
        msg.toLowerCase().includes('network') ||
        msg.includes('IO Error') ||
        msg.includes('timeout');
      setToastMessage(
        isNetwork
          ? 'Error de red al cargar fotos. Revisa internet y que la API esté disponible.'
          : msg || 'Error al cargar el vehículo',
      );
      setShowToast(true);
    } finally {
      if (blockUi) {
        setLoading(false);
      }
    }
  };

  const applyGuideEntry = (index: number) => {
    const entry = PHOTO_GUIDE_ENTRIES[index];
    if (!entry) return;
    setSelectedPhotoType(entry.type);
    setSelectedPhotoTitle(entry.title);
  };

  const endCaptureSession = (message?: string) => {
    setCaptureSession(null);
    setSessionAdvanceKey(0);
    setShowCameraGuide(false);
    setSelectedPhotoType('car');
    setSelectedPhotoTitle('');
    if (message) {
      setToastMessage(message);
      setShowToast(true);
    }
  };

  const advanceCaptureSession = () => {
    setSessionAdvanceKey((k) => k + 1);
  };

  const handleTakePhoto = () => {
    setCaptureSession({ index: 0 });
    setSessionAdvanceKey(0);
    applyGuideEntry(0);
    setShowCameraGuide(true);
  };

  const handleTakeSinglePhoto = () => {
    setCaptureSession(null);
    setSessionAdvanceKey(0);
    setShowPhotoTypeSelector(true);
  };

  const handlePhotoTypeSelected = (type: PhotoGuideType, title: string) => {
    setCaptureSession(null);
    setSessionAdvanceKey(0);
    setSelectedPhotoType(type);
    setSelectedPhotoTitle(title);
    setShowCameraGuide(true);
  };

  const handlePhotoTaken = (image: CameraImage) => {
    const session = captureSession;
    const entry = session ? PHOTO_GUIDE_ENTRIES[session.index] : null;

    if (image?.file) {
      const file =
        entry != null
          ? new File(
              [image.file],
              `photo_${entry.type}_${Date.now()}.jpg`,
              { type: image.file.type || 'image/jpeg' },
            )
          : image.file;
      setNewImages((prev) => [
        ...prev,
        {
          ...image,
          file,
          guideType: entry?.type,
          guideTitle: entry?.title,
        },
      ]);
    }

    if (session) {
      const nextIndex = session.index + 1;
      if (nextIndex >= PHOTO_GUIDE_ENTRIES.length) {
        endCaptureSession(
          `Sesión completada: ${PHOTO_GUIDE_ENTRIES.length} fotos según la guía.`,
        );
        return;
      }
      setCaptureSession({ index: nextIndex });
      applyGuideEntry(nextIndex);
      advanceCaptureSession();
      return;
    }

    setShowCameraGuide(false);
    setSelectedPhotoType('car');
    setSelectedPhotoTitle('');
  };

  const handleSkipCaptureStep = () => {
    if (!captureSession) return;
    const nextIndex = captureSession.index + 1;
    if (nextIndex >= PHOTO_GUIDE_ENTRIES.length) {
      endCaptureSession('Sesión terminada.');
      return;
    }
    setCaptureSession({ index: nextIndex });
    applyGuideEntry(nextIndex);
    advanceCaptureSession();
  };

  const handleFinishCaptureSession = () => {
    endCaptureSession('Sesión de fotos terminada. Puedes subir las fotos tomadas.');
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
    setNewImages((prev) => {
      const removed = prev[index];
      if (removed?.webPath?.startsWith('blob:')) {
        URL.revokeObjectURL(removed.webPath);
      }
      return prev.filter((_, i) => i !== index);
    });
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

      if (processNewWithAi) {
        const n = rawFiles.length;
        for (let i = 0; i < n; i++) {
          setIaProgress({ cur: i + 1, tot: n, step: 'ia' });
          const processedBatch = await geminiVehicleImageService.processFilesRecorteEmbellecer([
            rawFiles[i],
          ]);
          const processed = processedBatch[0];
          if (!processed) {
            throw new Error('La IA no devolvió imagen.');
          }
          setIaProgress({ cur: i + 1, tot: n, step: 'upload' });
          await vehicleService.uploadVehicleImages(vehicleUuid, [processed]);
        }
        setIaProgress(null);
      } else {
        const n = rawFiles.length;
        for (let i = 0; i < n; i++) {
          setIaProgress({ cur: i + 1, tot: n, step: 'upload' });
          await vehicleService.uploadVehicleImages(vehicleUuid, [rawFiles[i]]);
        }
        setIaProgress(null);
      }

      setUploadErrorAlert(null);
      setToastMessage(
        processNewWithAi ? 'Fotos procesadas con IA y subidas' : 'Fotos subidas correctamente',
      );
      setShowToast(true);
      setNewImages([]);
      await loadVehicle({ blockUi: false });
    } catch (e: unknown) {
      const msg = formatUploadError(e, {
        vehicleUuid: vehicleUuid ?? undefined,
        photoTotal: rawFiles.length,
        step: processNewWithAi ? 'ia' : 'upload',
      });
      logUploadDiagnostic('VehiclePhotos.handleUploadImages', {
        vehicleUuid,
        photoCount: rawFiles.length,
        processNewWithAi,
        message: msg,
      });
      setUploadErrorAlert(msg);
      setToastMessage(msg.split('\n')[0] || 'Error al subir fotos');
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
      await loadVehicle({ blockUi: false });
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
      await loadVehicle({ blockUi: false });
    } catch {
      setToastMessage('Error al eliminar imagen');
      setShowToast(true);
    }
  };

  const persistImageOrder = async (ordered: VehicleImage[]) => {
    if (!vehicleUuid) return;
    const imageOrder = ordered.map((img, i) => ({
      uuid: img.uuid,
      sort_id: i + 1,
    }));
    await vehicleService.updateImageOrder(vehicleUuid, imageOrder);
  };

  const handleMoveImage = async (index: number, delta: -1 | 1) => {
    if (!vehicleUuid || reordering || uploading || busyExisting) return;
    const target = index + delta;
    if (target < 0 || target >= images.length) return;

    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    setImages(reordered);

    try {
      setReordering(true);
      await persistImageOrder(reordered);
      setToastMessage('Orden de fotos actualizado');
      setShowToast(true);
    } catch {
      setToastMessage('No se pudo guardar el orden');
      setShowToast(true);
      await loadVehicle({ blockUi: false });
    } finally {
      setReordering(false);
    }
  };

  const busyExisting = Boolean(processingImageUuid);
  const vehicleLabel = `${vehicle?.brand?.name ?? ''} ${vehicle?.model?.name ?? ''}`.trim() || 'Vehículo';

  const handleStartBatchAi = (targets: BatchImageTarget[]) => {
    if (!vehicleUuid || !targets.length) return;
    const jobId = vehicleImageAiBatchService.startBatch(vehicleUuid, vehicleLabel, targets);
    if (!jobId) {
      setToastMessage(
        'Ya hay un lote de IA en curso. Espera a que termine o falla antes de iniciar otro.',
      );
      setShowToast(true);
      return;
    }
    setShowBatchAiModal(false);
    setToastMessage(
      `Procesamiento en segundo plano (${targets.length} foto${targets.length === 1 ? '' : 's'}, una a la vez). Puedes ir a la siguiente unidad.`,
    );
    setShowToast(true);
    const newIndices = new Set(
      targets
        .filter((t) => t.kind === 'new')
        .map((t) => Number(t.localId.replace('new_', ''))),
    );
    if (newIndices.size > 0) {
      setNewImages((prev) => {
        prev.forEach((img, i) => {
          if (newIndices.has(i) && img.webPath?.startsWith('blob:')) {
            URL.revokeObjectURL(img.webPath);
          }
        });
        return prev.filter((_, i) => !newIndices.has(i));
      });
    }
  };

  /** Overlay solo en carga inicial (sin fotos aún), subida, IA o reordenar. */
  const showBlockingOverlay =
    (loading && images.length === 0 && !vehicle) ||
    uploading ||
    busyExisting ||
    reordering;

  const blockingOverlayMessage = (() => {
    if (busyExisting && loading) {
      return 'Actualizando galería…';
    }
    if (busyExisting) {
      return 'Descargando y procesando imagen con IA…';
    }
    if (uploading && iaProgress && iaProgress.tot > 0) {
      if (iaProgress.cur <= 0) {
        return 'Preparando procesamiento con IA…';
      }
      if (iaProgress.step === 'upload') {
        return `Subiendo foto ${iaProgress.cur} de ${iaProgress.tot}…`;
      }
      return `IA: foto ${iaProgress.cur} de ${iaProgress.tot}…`;
    }
    if (reordering) {
      return 'Guardando orden de fotos…';
    }
    if (uploading) {
      return 'Subiendo fotos…';
    }
    if (loading) {
      return 'Cargando fotos…';
    }
    return 'Procesando…';
  })();

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
        <div className="vehicle-photos-container">
          <h2 className="photos-section-title">{vehicleLabel}</h2>

          <VehicleIaBatchBanner vehicleUuid={vehicleUuid} />

          <IonCard className="ia-info-card">
            <IonCardContent>
              <IonItem lines="none">
                <IonToggle
                  checked={processNewWithAi}
                  disabled={!geminiConfigured || uploading || busyExisting}
                  onIonChange={(e) => setProcessNewWithAi(Boolean(e.detail.checked))}
                >
                  <IonLabel>
                    <strong>IA antes de subir nuevas fotos</strong>
                    <p>
                      Ciclorama estudio ABCars con Gemini: cada foto se procesa y se sube de una en una (menos
                      memoria y timeouts).
                    </p>
                  </IonLabel>
                </IonToggle>
              </IonItem>
              {!geminiConfigured && (
                <IonNote className="ia-note">
                  Si el servidor ya tiene clave Gemini y sigues sin IA: despliega el backend actualizado, permisos de
                  fotos (crear/actualizar vehículo) y vuelve a abrir esta pantalla.
                </IonNote>
              )}
              {geminiConfigured && (images.length > 0 || newImages.length > 0) && (
                <IonButton
                  expand="block"
                  color="warning"
                  className="batch-ia-open-btn"
                  disabled={uploading || busyExisting}
                  onClick={() => setShowBatchAiModal(true)}
                >
                  <IonIcon icon={layersOutline} slot="start" />
                  Procesar varias con IA (seleccionar)
                </IonButton>
              )}
            </IonCardContent>
          </IonCard>

          {images.length > 0 && (
            <div className="existing-photos-section">
              <h3 className="photos-subtitle">Fotos existentes</h3>
              <p className="photos-hint-existing">
                Flechas: orden. Rayo: una foto con IA. Varias a la vez: botón «Procesar varias con IA».
              </p>
              <IonGrid>
                <IonRow>
                  {images.map((image, idx) => (
                    <IonCol size="6" sizeMd="4" key={image.uuid}>
                      <div
                        className={`photo-item${
                          processingImageUuid === image.uuid ? ' photo-item--processing' : ''
                        }`}
                      >
                        <img
                          src={image.service_image_url || image.image_path}
                          alt={`Foto ${image.sort_id}`}
                          className="photo-image photo-image--preview"
                          onClick={() => openLightboxAt(idx)}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTdlOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
                          }}
                        />
                        {processingImageUuid === image.uuid && (
                          <div className="photo-processing-overlay" aria-busy="true" aria-label="Procesando imagen">
                            <IonSpinner name="crescent" color="light" />
                          </div>
                        )}
                        <div className="photo-reorder-btns">
                          <IonButton
                            fill="clear"
                            size="small"
                            className="photo-reorder-btn"
                            disabled={idx === 0 || reordering || uploading || busyExisting}
                            onClick={() => handleMoveImage(idx, -1)}
                          >
                            <IonIcon icon={chevronUpOutline} slot="icon-only" />
                          </IonButton>
                          <IonButton
                            fill="clear"
                            size="small"
                            className="photo-reorder-btn"
                            disabled={
                              idx >= images.length - 1 ||
                              reordering ||
                              uploading ||
                              busyExisting
                            }
                            onClick={() => handleMoveImage(idx, 1)}
                          >
                            <IonIcon icon={chevronDownOutline} slot="icon-only" />
                          </IonButton>
                        </div>
                        <IonButton
                          fill="solid"
                          color="warning"
                          size="small"
                          className="photo-ia-btn"
                          disabled={
                            !geminiConfigured ||
                            uploading ||
                            busyExisting ||
                            reordering ||
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
                disabled={uploading || busyExisting}
              >
                <IonIcon icon={cameraOutline} slot="start" />
                Tomar fotos (guía completa)
              </IonButton>
              <IonButton
                expand="block"
                fill="clear"
                size="small"
                onClick={handleTakeSinglePhoto}
                disabled={uploading || busyExisting}
                className="single-photo-button"
              >
                Una foto (elegir ángulo)
              </IonButton>
              <IonButton
                expand="block"
                fill="outline"
                onClick={handleSelectFromGallery}
                disabled={uploading || busyExisting}
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
                            disabled={uploading || busyExisting}
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
                  disabled={uploading || busyExisting}
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

        {showBlockingOverlay ? (
          <IonLoading
            key={`photos-busy-${blockingOverlayMessage}`}
            isOpen
            message={blockingOverlayMessage}
          />
        ) : null}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => {
            setShowToast(false);
            if (!uploadErrorAlert) return;
          }}
          message={toastMessage}
          duration={uploadErrorAlert ? 8000 : 4000}
          position="top"
          color={uploadErrorAlert ? 'danger' : undefined}
        />

        <IonAlert
          isOpen={uploadErrorAlert != null}
          onDidDismiss={() => setUploadErrorAlert(null)}
          header="No se pudieron subir las fotos"
          message={uploadErrorAlert ?? ''}
          buttons={['Entendido']}
          cssClass="upload-error-alert"
        />

        <PhotoTypeSelector
          isOpen={showPhotoTypeSelector}
          onClose={() => setShowPhotoTypeSelector(false)}
          onSelect={handlePhotoTypeSelected}
        />

        <CameraWithGuide
          isOpen={showCameraGuide}
          onClose={() => {
            if (captureSession) {
              endCaptureSession();
            } else {
              setShowCameraGuide(false);
              setSelectedPhotoType('car');
              setSelectedPhotoTitle('');
            }
          }}
          onPhotoTaken={handlePhotoTaken}
          guideType={selectedPhotoType}
          photoTitle={selectedPhotoTitle}
          continueAfterCapture={captureSession != null}
          sessionStep={captureSession ? captureSession.index + 1 : 0}
          sessionTotal={captureSession ? PHOTO_GUIDE_ENTRIES.length : 0}
          sessionAdvanceKey={sessionAdvanceKey}
          onSkipStep={captureSession ? handleSkipCaptureStep : undefined}
          onFinishSession={captureSession ? handleFinishCaptureSession : undefined}
        />

        <PhotoGuideModal
          isOpen={showPhotoGuide}
          onClose={() => setShowPhotoGuide(false)}
        />

        <ImageLightbox
          isOpen={lightboxOpen}
          urls={galleryUrls}
          initialIndex={lightboxIndex}
          title="Foto"
          onClose={() => setLightboxOpen(false)}
        />

        <BatchAiProcessModal
          isOpen={showBatchAiModal}
          onClose={() => setShowBatchAiModal(false)}
          vehicleLabel={vehicleLabel}
          existingImages={images}
          newImages={newImages}
          onConfirmStart={handleStartBatchAi}
        />
      </IonContent>
    </IonPage>
  );
};

export default VehiclePhotos;

