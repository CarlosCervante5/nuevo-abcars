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
import { cameraOutline, imageOutline, checkmarkCircle, trashOutline, informationCircle } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle, VehicleImage } from '../../models/Vehicle';
import { cameraHelper, CameraImage } from '../../utils/camera';
import CameraWithGuide from '../../components/CameraWithGuide';
import PhotoGuideModal from '../../components/PhotoGuideModal';
import PhotoTypeSelector, { PhotoGuideType } from '../../components/PhotoTypeSelector';
import './VehiclePhotos.css';

const VehiclePhotos: React.FC = () => {
  const { vehicleUuid } = useParams<{ vehicleUuid: string }>();
  const history = useHistory();
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
        setImages(response.data.images || []);
      }
    } catch (error: any) {
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
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
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

    try {
      setUploading(true);
      const files = newImages.map((img) => img.file).filter((f): f is File => f !== null);
      
      await vehicleService.uploadVehicleImages(vehicleUuid, files);
      
      setToastMessage('Fotos subidas correctamente');
      setShowToast(true);
      setNewImages([]);
      await loadVehicle(); // Recargar para ver las nuevas imágenes
    } catch (error: any) {
      setToastMessage('Error al subir fotos');
      setShowToast(true);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageUuid: string) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen?')) return;

    try {
      await vehicleService.deleteVehicleImage(imageUuid);
      setToastMessage('Imagen eliminada correctamente');
      setShowToast(true);
      await loadVehicle();
    } catch (error: any) {
      setToastMessage('Error al eliminar imagen');
      setShowToast(true);
    }
  };

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
        <IonLoading isOpen={loading} message="Cargando fotos..." />

        <div className="vehicle-photos-container">
          <h2 className="photos-section-title">
            {vehicle?.brand?.name} {vehicle?.model?.name}
          </h2>

          {/* Imágenes existentes */}
          {images.length > 0 && (
            <div className="existing-photos-section">
              <h3 className="photos-subtitle">Fotos Existentes</h3>
              <IonGrid>
                <IonRow>
                  {images.map((image) => (
                    <IonCol size="6" sizeMd="4" key={image.uuid}>
                      <div className="photo-item">
                        <img
                          src={image.service_image_url || image.image_path}
                          alt={`Foto ${image.sort_id}`}
                          className="photo-image"
                          onError={(e) => {
                            // Si falla la carga, mostrar placeholder
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTdlOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
                          }}
                        />
                        <IonButton
                          fill="clear"
                          color="danger"
                          size="small"
                          onClick={() => handleDeleteImage(image.uuid)}
                          className="photo-delete-btn"
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

          {/* Nuevas imágenes para subir */}
          <div className="new-photos-section">
            <div className="photos-subtitle-container">
              <h3 className="photos-subtitle">Nuevas Fotos</h3>
              <IonButton
                fill="clear"
                size="small"
                onClick={() => setShowPhotoGuide(true)}
                className="guide-button"
              >
                <IonIcon icon={informationCircle} slot="start" />
                Ver Guía
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
                Tomar Foto
              </IonButton>
              <IonButton
                expand="block"
                fill="outline"
                onClick={handleSelectFromGallery}
                disabled={uploading}
              >
                <IonIcon icon={imageOutline} slot="start" />
                Seleccionar de Galería
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
                  {uploading ? 'Subiendo...' : `Subir ${newImages.length} Foto(s)`}
                </IonButton>
              </>
            )}
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
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

