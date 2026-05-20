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
  IonTextarea,
} from '@ionic/react';
import { constructOutline, trashOutline } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { valuationService } from '../../services/valuationService';
import { Repair } from '../../models';
import './RepairsList.css';

const RepairsList: React.FC = () => {
  const { valuationUuid } = useParams<{ valuationUuid: string }>();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  const [damageImage, setDamageImage] = useState<File | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);

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

  const handleSubmit = async () => {
    if (!valuationUuid || !damageImage || !description.trim()) return;

    try {
      setSubmitting(true);
      const res = await valuationService.createBodyworkRequest(
        description.trim(),
        damageImage,
        valuationUuid
      );
      setDescription('');
      setDamageImage(null);
      setToastMessage((res as any)?.message || 'Solicitud HyP enviada');
      setShowToast(true);
      loadRepairs();
    } catch (error: any) {
      setToastMessage('Error al enviar solicitud HyP');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (repairUuid: string) => {
    if (!window.confirm('¿Eliminar esta solicitud HyP?')) return;
    try {
      setDeletingUuid(repairUuid);
      await valuationService.deleteBodywork(repairUuid);
      setToastMessage('Solicitud HyP eliminada');
      setShowToast(true);
      await loadRepairs();
    } catch {
      setToastMessage('No se pudo eliminar la solicitud');
      setShowToast(true);
    } finally {
      setDeletingUuid(null);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/valuations" />
          </IonButtons>
          <IonTitle>Solicitud HyP</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="repairs-container">
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Agregar HyP</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Descripción del daño</IonLabel>
                <IonTextarea
                  value={description}
                  onIonInput={(e) => setDescription(e.detail.value || '')}
                  rows={4}
                  placeholder="Descripción del daño..."
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Imagen/Foto del daño</IonLabel>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setDamageImage(file);
                  }}
                />
              </IonItem>
              <IonButton
                expand="block"
                onClick={handleSubmit}
                disabled={!description.trim() || !damageImage || submitting}
              >
                {submitting ? 'Enviando...' : 'Solicitar'}
              </IonButton>
            </IonCardContent>
          </IonCard>

          {loading ? (
            <IonLoading isOpen={loading} message="Cargando HyP..." />
          ) : (
            <>
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Conceptos HyP Solicitados</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {repairs.length === 0 ? (
                    <div className="empty-state">
                      <IonIcon icon={constructOutline} size="large" />
                      <p>Sin descripciones HyP solicitadas</p>
                    </div>
                  ) : (
                    <IonList>
                      {repairs.map((repair) => (
                        <IonCard key={repair.uuid}>
                          <IonCardHeader>
                            <div className="hyp-card-header">
                              <IonCardTitle className="hyp-description">
                                {repair.description}
                              </IonCardTitle>
                              <IonButton
                                fill="clear"
                                color="danger"
                                size="small"
                                disabled={deletingUuid === repair.uuid}
                                onClick={() => handleDelete(repair.uuid)}
                              >
                                <IonIcon icon={trashOutline} slot="icon-only" />
                              </IonButton>
                            </div>
                          </IonCardHeader>
                          {repair.image_path && (
                            <IonCardContent>
                              <img
                                src={repair.image_path}
                                alt="Imagen del daño"
                                style={{ width: '100%', borderRadius: '8px' }}
                              />
                            </IonCardContent>
                          )}
                        </IonCard>
                      ))}
                    </IonList>
                  )}
                </IonCardContent>
              </IonCard>
            </>
          )}
        </div>
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

