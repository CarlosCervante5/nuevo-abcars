import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonLoading,
  IonToast,
  IonBackButton,
  IonButtons,
  IonFab,
  IonFabButton,
  IonModal,
  IonInput,
  IonButtons as IonButtonsModal,
  IonButton as IonButtonModal,
} from '@ionic/react';
import {
  add,
  cubeOutline,
  close,
  createOutline,
  cameraOutline,
  imageOutline,
  trashOutline,
} from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { valuationService } from '../../services/valuationService';
import { Part, CreatePartRequest, UpdatePartRequest } from '../../models';
import { cameraHelper, CameraImage } from '../../utils/camera';
import './PartsList.css';

const PartsList: React.FC = () => {
  const { valuationUuid } = useParams<{ valuationUuid: string }>();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    supplier: '',
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [partImages, setPartImages] = useState<CameraImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    if (valuationUuid) {
      loadParts();
    }
  }, [valuationUuid]);

  const loadParts = async () => {
    if (!valuationUuid) return;

    try {
      setLoading(true);
      const response = await valuationService.getParts(valuationUuid);
      if (response.status === 200 && response.data) {
        setParts(response.data);
      }
    } catch (error: any) {
      setToastMessage('Error al cargar refacciones');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (part?: Part) => {
    if (part) {
      setEditingPart(part);
      setFormData({
        name: part.name,
        cost: part.cost.toString(),
        supplier: part.supplier || '',
      });
    } else {
      setEditingPart(null);
      setFormData({
        name: '',
        cost: '',
        supplier: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPart(null);
    setPartImages([]);
    setFormData({
      name: '',
      cost: '',
      supplier: '',
    });
  };

  const handleTakePhoto = async () => {
    try {
      const image = await cameraHelper.takePhoto('camera');
      if (!image || !image.file) return;
      setPartImages((prev) => [...prev, image]);
    } catch (error: any) {
      setToastMessage('Error al capturar foto');
      setShowToast(true);
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const image = await cameraHelper.takePhoto('gallery');
      if (!image || !image.file) return;
      setPartImages((prev) => [...prev, image]);
    } catch (error: any) {
      setToastMessage('Error al seleccionar foto');
      setShowToast(true);
    }
  };

  const handleRemoveImage = (imageIndex: number) => {
    setPartImages((prev) => prev.filter((_, idx) => idx !== imageIndex));
  };

  const handleSave = async () => {
    if (!valuationUuid) return;

    try {
      if (editingPart) {
        // Actualizar
        const request: UpdatePartRequest = {
          name: formData.name,
          cost: parseFloat(formData.cost),
          supplier: formData.supplier || undefined,
        };
        await valuationService.updatePart(editingPart.uuid, request);
        
        // Subir imágenes asociadas a la refacción
        if (partImages.length > 0) {
          setUploadingImages(true);
          for (let i = 0; i < partImages.length; i++) {
            const image = partImages[i];
            if (image.file) {
              await valuationService.uploadImage(
                valuationUuid,
                `part_${editingPart.uuid}_${i}`,
                image.file,
                'part'
              );
            }
          }
          setUploadingImages(false);
        }
        
        setToastMessage('Refacción actualizada');
      } else {
        // Crear
        const request: CreatePartRequest = {
          valuation_uuid: valuationUuid,
          name: formData.name,
          cost: parseFloat(formData.cost),
          supplier: formData.supplier || undefined,
        };
        await valuationService.createPart(request);
        setToastMessage('Refacción creada');
      }
      setShowToast(true);
      handleCloseModal();
      loadParts();
    } catch (error: any) {
      setToastMessage('Error al guardar refacción');
      setShowToast(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const totalCost = parts.reduce((sum, part) => sum + part.cost, 0);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/valuations" />
          </IonButtons>
          <IonTitle>Refacciones</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="parts-container">
          {loading ? (
            <IonLoading isOpen={loading} message="Cargando refacciones..." />
          ) : (
            <>
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Resumen</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem lines="none">
                    <IonLabel>
                      <h2>Total de Refacciones</h2>
                      <p>{parts.length}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem lines="none">
                    <IonLabel>
                      <h2>Costo Total</h2>
                      <p className="total-cost">{formatCurrency(totalCost)}</p>
                    </IonLabel>
                  </IonItem>
                </IonCardContent>
              </IonCard>

              <IonList>
                {parts.map((part) => (
                  <IonCard key={part.uuid}>
                    <IonCardHeader>
                      <div className="card-header">
                        <IonCardTitle>{part.name}</IonCardTitle>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => handleOpenModal(part)}
                        >
                          <IonIcon icon={createOutline} />
                        </IonButton>
                      </div>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonItem lines="none">
                        <IonLabel>
                          <h3>Costo</h3>
                          <p>{formatCurrency(part.cost)}</p>
                        </IonLabel>
                      </IonItem>
                      {part.supplier && (
                        <IonItem lines="none">
                          <IonLabel>
                            <h3>Proveedor</h3>
                            <p>{part.supplier}</p>
                          </IonLabel>
                        </IonItem>
                      )}
                    </IonCardContent>
                  </IonCard>
                ))}
              </IonList>

              {parts.length === 0 && (
                <div className="empty-state">
                  <IonIcon icon={cubeOutline} size="large" />
                  <p>No hay refacciones registradas</p>
                </div>
              )}
            </>
          )}
        </div>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => handleOpenModal()}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={showModal} onDidDismiss={handleCloseModal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                {editingPart ? 'Editar Refacción' : 'Nueva Refacción'}
              </IonTitle>
              <IonButtonsModal slot="end">
                <IonButtonModal onClick={handleCloseModal}>
                  <IonIcon icon={close} />
                </IonButtonModal>
              </IonButtonsModal>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Nombre *</IonLabel>
              <IonInput
                value={formData.name}
                onIonInput={(e) =>
                  setFormData({ ...formData, name: e.detail.value! })
                }
                placeholder="Nombre de la refacción"
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Costo (MXN) *</IonLabel>
              <IonInput
                type="number"
                value={formData.cost}
                onIonInput={(e) =>
                  setFormData({ ...formData, cost: e.detail.value! })
                }
                placeholder="0.00"
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Proveedor</IonLabel>
              <IonInput
                value={formData.supplier}
                onIonInput={(e) =>
                  setFormData({ ...formData, supplier: e.detail.value! })
                }
                placeholder="Nombre del proveedor"
              />
            </IonItem>

            {/* Botones para agregar fotos */}
            <div className="photo-actions">
              <IonButton
                fill="outline"
                expand="block"
                onClick={handleTakePhoto}
                disabled={uploadingImages}
              >
                <IonIcon icon={cameraOutline} slot="start" />
                Tomar Foto
              </IonButton>
              <IonButton
                fill="outline"
                expand="block"
                onClick={handleSelectFromGallery}
                disabled={uploadingImages}
              >
                <IonIcon icon={imageOutline} slot="start" />
                Seleccionar de Galería
              </IonButton>
            </div>

            {/* Preview de fotos */}
            {partImages.length > 0 && (
              <div className="photo-preview-container">
                {partImages.map((image, idx) => (
                  <div key={idx} className="photo-preview">
                    <img src={image.webPath} alt={`Foto ${idx + 1}`} />
                    <IonButton
                      fill="clear"
                      size="small"
                      color="danger"
                      onClick={() => handleRemoveImage(idx)}
                      className="photo-remove-btn"
                    >
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  </div>
                ))}
              </div>
            )}

            <IonButton
              expand="block"
              onClick={handleSave}
              disabled={!formData.name || !formData.cost || uploadingImages}
              className="ion-margin-top"
            >
              {editingPart ? 'Actualizar' : 'Guardar'}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default PartsList;

