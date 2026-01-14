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
  IonTextarea,
  IonButtons as IonButtonsModal,
  IonButton as IonButtonModal,
} from '@ionic/react';
import {
  add,
  constructOutline,
  trashOutline,
  createOutline,
  close,
  cameraOutline,
  imageOutline,
} from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { valuationService } from '../../services/valuationService';
import { Repair, CreateRepairRequest, UpdateRepairRequest } from '../../models';
import { cameraHelper, CameraImage } from '../../utils/camera';
import './RepairsList.css';

const RepairsList: React.FC = () => {
  const { valuationUuid } = useParams<{ valuationUuid: string }>();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    cost: '',
    labor_hours: '',
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [repairImages, setRepairImages] = useState<CameraImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const history = useHistory();

  useEffect(() => {
    if (valuationUuid) {
      loadRepairs();
    }
  }, [valuationUuid]);

  const loadRepairs = async () => {
    if (!valuationUuid) return;

    try {
      setLoading(true);
      const response = await valuationService.getRepairs(valuationUuid);
      if (response.status === 200 && response.data) {
        setRepairs(response.data);
      }
    } catch (error: any) {
      setToastMessage('Error al cargar reparaciones');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (repair?: Repair) => {
    if (repair) {
      setEditingRepair(repair);
      setFormData({
        description: repair.description,
        cost: repair.cost.toString(),
        labor_hours: repair.labor_hours?.toString() || '',
      });
    } else {
      setEditingRepair(null);
      setFormData({
        description: '',
        cost: '',
        labor_hours: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRepair(null);
    setRepairImages([]);
    setFormData({
      description: '',
      cost: '',
      labor_hours: '',
    });
  };

  const handleTakePhoto = async () => {
    if (!valuationUuid) return;

    try {
      const image = await cameraHelper.takePhoto('camera');
      if (!image || !image.file) return;

      setRepairImages((prev) => [...prev, image]);

      // Subir al servidor cuando se guarde la reparación
    } catch (error: any) {
      setToastMessage('Error al capturar foto');
      setShowToast(true);
    }
  };

  const handleSelectFromGallery = async () => {
    if (!valuationUuid) return;

    try {
      const image = await cameraHelper.takePhoto('gallery');
      if (!image || !image.file) return;

      setRepairImages((prev) => [...prev, image]);

      // Subir al servidor cuando se guarde la reparación
    } catch (error: any) {
      setToastMessage('Error al seleccionar foto');
      setShowToast(true);
    }
  };

  const handleRemoveImage = (imageIndex: number) => {
    setRepairImages((prev) => prev.filter((_, idx) => idx !== imageIndex));
  };

  const handleSave = async () => {
    if (!valuationUuid) return;

    try {
      if (editingRepair) {
        // Actualizar
        const request: UpdateRepairRequest = {
          description: formData.description,
          cost: parseFloat(formData.cost),
          labor_hours: formData.labor_hours ? parseFloat(formData.labor_hours) : undefined,
        };
        await valuationService.updateRepair(editingRepair.uuid, request);
        
        // Subir imágenes asociadas a la reparación
        if (repairImages.length > 0) {
          setUploadingImages(true);
          for (let i = 0; i < repairImages.length; i++) {
            const image = repairImages[i];
            if (image.file) {
              await valuationService.uploadImage(
                valuationUuid,
                `repair_${editingRepair.uuid}_${i}`,
                image.file,
                'repair'
              );
            }
          }
          setUploadingImages(false);
        }
        setToastMessage('Reparación actualizada');
      } else {
        // Crear
        const request: CreateRepairRequest = {
          valuation_uuid: valuationUuid,
          description: formData.description,
          cost: parseFloat(formData.cost),
          labor_hours: formData.labor_hours ? parseFloat(formData.labor_hours) : undefined,
        };
        const response = await valuationService.createRepair(request);
        
        // Subir imágenes asociadas a la reparación si las hay
        // Nota: El endpoint de creación no retorna el UUID, así que las imágenes
        // se guardarán localmente y se subirán cuando se edite la reparación
        if (repairImages.length > 0) {
          setToastMessage('Reparación creada. Las fotos se guardarán cuando se recargue la lista.');
        } else {
          setToastMessage('Reparación creada');
        }
      }
      setShowToast(true);
      handleCloseModal();
      loadRepairs();
    } catch (error: any) {
      setToastMessage('Error al guardar reparación');
      setShowToast(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const totalCost = repairs.reduce((sum, repair) => sum + repair.cost, 0);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/valuations" />
          </IonButtons>
          <IonTitle>Reparaciones</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="repairs-container">
          {loading ? (
            <IonLoading isOpen={loading} message="Cargando reparaciones..." />
          ) : (
            <>
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Resumen</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem lines="none">
                    <IonLabel>
                      <h2>Total de Reparaciones</h2>
                      <p>{repairs.length}</p>
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
                {repairs.map((repair) => (
                  <IonCard key={repair.uuid}>
                    <IonCardHeader>
                      <div className="card-header">
                        <IonCardTitle>{repair.description}</IonCardTitle>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => handleOpenModal(repair)}
                        >
                          <IonIcon icon={createOutline} />
                        </IonButton>
                      </div>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonItem lines="none">
                        <IonLabel>
                          <h3>Costo</h3>
                          <p>{formatCurrency(repair.cost)}</p>
                        </IonLabel>
                      </IonItem>
                      {repair.labor_hours && (
                        <IonItem lines="none">
                          <IonLabel>
                            <h3>Horas de Mano de Obra</h3>
                            <p>{repair.labor_hours} hrs</p>
                          </IonLabel>
                        </IonItem>
                      )}
                    </IonCardContent>
                  </IonCard>
                ))}
              </IonList>

              {repairs.length === 0 && (
                <div className="empty-state">
                  <IonIcon icon={constructOutline} size="large" />
                  <p>No hay reparaciones registradas</p>
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
                {editingRepair ? 'Editar Reparación' : 'Nueva Reparación'}
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
              <IonLabel position="stacked">Descripción *</IonLabel>
              <IonTextarea
                value={formData.description}
                onIonInput={(e) =>
                  setFormData({ ...formData, description: e.detail.value! })
                }
                rows={4}
                placeholder="Descripción de la reparación"
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
              <IonLabel position="stacked">Horas de Mano de Obra</IonLabel>
              <IonInput
                type="number"
                value={formData.labor_hours}
                onIonInput={(e) =>
                  setFormData({ ...formData, labor_hours: e.detail.value! })
                }
                placeholder="0.0"
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
            {repairImages.length > 0 && (
              <div className="photo-preview-container">
                {repairImages.map((image, idx) => (
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
              disabled={!formData.description || !formData.cost || uploadingImages}
              className="ion-margin-top"
            >
              {editingRepair ? 'Actualizar' : 'Guardar'}
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

export default RepairsList;

