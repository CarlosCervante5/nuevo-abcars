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
  IonInput,
} from '@ionic/react';
import { cubeOutline, trashOutline } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { valuationService } from '../../services/valuationService';
import { SparePartItem } from '../../models';
import './PartsList.css';

const PartsList: React.FC = () => {
  const { valuationUuid } = useParams<{ valuationUuid: string }>();
  const [parts, setParts] = useState<SparePartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    hours: '',
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

  const handleSave = async () => {
    if (!valuationUuid) return;
    const amount = Number(formData.amount);
    const hours = Number(formData.hours);

    if (!formData.name.trim() || Number.isNaN(amount) || Number.isNaN(hours)) {
      setToastMessage('Completa los campos requeridos');
      setShowToast(true);
      return;
    }

    try {
      setSubmitting(true);
      await valuationService.createSparePart({
        valuation_uuid: valuationUuid,
        name: formData.name.trim(),
        quantity: amount,
        labor_time: hours,
      });
      setToastMessage('Refacción registrada');
      setShowToast(true);
      setFormData({ name: '', amount: '', hours: '' });
      loadParts();
    } catch (error: any) {
      setToastMessage('Error al guardar refacción');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (partUuid: string) => {
    try {
      await valuationService.deleteSparePart(partUuid);
      setToastMessage('Refacción eliminada');
      setShowToast(true);
      loadParts();
    } catch (error: any) {
      setToastMessage('Error al eliminar refacción');
      setShowToast(true);
    }
  };

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
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Solicitud de refacciones</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Nombre de la refacción</IonLabel>
                <IonInput
                  value={formData.name}
                  onIonInput={(e) =>
                    setFormData({ ...formData, name: e.detail.value || '' })
                  }
                  placeholder="Nombre"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Piezas (Cantidad)</IonLabel>
                <IonInput
                  type="number"
                  value={formData.amount}
                  onIonInput={(e) =>
                    setFormData({ ...formData, amount: e.detail.value || '' })
                  }
                  placeholder="1"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Tiempo (Horas)</IonLabel>
                <IonInput
                  type="number"
                  value={formData.hours}
                  onIonInput={(e) =>
                    setFormData({ ...formData, hours: e.detail.value || '' })
                  }
                  placeholder="1 o 0.3"
                />
              </IonItem>
              <IonButton
                expand="block"
                onClick={handleSave}
                disabled={!formData.name || !formData.amount || !formData.hours || submitting}
              >
                {submitting ? 'Registrando...' : 'Registrar'}
              </IonButton>
            </IonCardContent>
          </IonCard>

          {loading ? (
            <IonLoading isOpen={loading} message="Cargando refacciones..." />
          ) : (
            <>
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>
                    Solicitud de Refacciones ({parts.length})
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {parts.length === 0 ? (
                    <div className="empty-state">
                      <IonIcon icon={cubeOutline} size="large" />
                      <p>Aún no has agregado ninguna refacción a solicitar.</p>
                    </div>
                  ) : (
                    <IonList>
                      {parts.map((part, index) => (
                        <IonItem key={part.uuid || `${part.name}-${index}`}>
                          <IonLabel>
                            <h2>{part.name}</h2>
                            <p>Cantidad: {part.quantity} pza(s)</p>
                            <p>Ensamble: {part.labor_time} hrs(s)</p>
                          </IonLabel>
                          <IonButton
                            fill="clear"
                            color="danger"
                            onClick={() => handleDelete(part.uuid)}
                          >
                            <IonIcon icon={trashOutline} />
                          </IonButton>
                        </IonItem>
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

export default PartsList;

