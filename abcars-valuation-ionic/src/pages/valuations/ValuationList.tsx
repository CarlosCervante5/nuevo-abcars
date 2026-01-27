import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonLoading,
  IonAlert,
  IonFab,
  IonFabButton,
  useIonViewWillEnter,
} from '@ionic/react';
import { refresh, carOutline, calendarOutline, add, logOutOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { valuationService } from '../../services/valuationService';
import { Valuation } from '../../models';
import { authService } from '../../services/authService';
import './ValuationList.css';

const ValuationList: React.FC = () => {
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const history = useHistory();
  const location = useLocation<{ refresh?: boolean }>();

  useEffect(() => {
    loadValuations();
  }, []);

  useIonViewWillEnter(() => {
    loadValuations();
  });

  useEffect(() => {
    if (location.state?.refresh) {
      loadValuations();
      history.replace({ ...location, state: {} });
    }
  }, [location.key]);

  const loadValuations = async () => {
    try {
      setLoading(true);
      const response = await valuationService.getValuations('to_appraise');

      console.log('Valuations raw response:', JSON.stringify(response, null, 2));

      // Hacer el frontend tolerante a diferentes formas de respuesta (con o sin wrapper)
      const apiData: any = response || {};
      let valuationsData: Valuation[] = [];

      // Caso 1: Respuesta envuelta: { status, message, data: { data: [...] }}
      if (apiData?.data?.data && Array.isArray(apiData.data.data)) {
        valuationsData = apiData.data.data;
      }
      // Caso 2: Respuesta paginada directa: { data: [...], current_page, ... }
      else if (apiData?.data && Array.isArray(apiData.data)) {
        valuationsData = apiData.data as Valuation[];
      }
      // Caso 3: Respuesta directa como array
      else if (Array.isArray(apiData)) {
        valuationsData = apiData as Valuation[];
      }

      console.log('Valuations parsed:', valuationsData);

      if (valuationsData.length > 0) {
        console.log('First valuation:', valuationsData[0]);
        console.log('First valuation vehicle:', valuationsData[0].vehicle);
        console.log('Brand:', valuationsData[0].vehicle?.brand);
        console.log('Model:', valuationsData[0].vehicle?.model);
      }

      setValuations(valuationsData);
      setError('');
    } catch (err: any) {
      console.error('Error loading valuations:', err);
      console.error('Error response:', err?.response?.data);
      setValuations([]);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Error al cargar valuaciones'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (e: CustomEvent) => {
    await loadValuations();
    (e.target as HTMLIonRefresherElement).complete();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checklist_ready':
        return 'success';
      case 'to_appraise':
        return 'warning';
      case 'completed':
        return 'primary';
      case 'appraised':
        return 'medium';
      case 'on_progress':
        return 'tertiary';
      case 'acquired':
        return 'success';
      case 'on_hold':
        return 'danger';
      case 'valuated':
        return 'medium';
      case 'complete_file':
        return 'warning';
      default:
        return 'medium';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'to_appraise':
        return 'Por valuar';
      case 'on_progress':
        return 'En progreso';
      case 'checklist_ready':
        return 'Listo p/valuar';
      case 'valuated':
        return 'Valuado';
      case 'complete_file':
        return 'Expediente completo';
      case 'completed':
        return 'Completado';
      case 'appraised':
        return 'Valuado';
      case 'acquired':
        return 'Adquirido';
      case 'on_hold':
        return 'En espera';
      default:
        return status || 'L.P. Venta';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Valuaciones</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => authService.logout()}>
              <IonIcon icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {loading ? (
          <IonLoading isOpen={loading} message="Cargando valuaciones..." />
        ) : valuations.length === 0 ? (
          <div className="empty-state">
            <IonIcon icon={carOutline} size="large" />
            <p>No hay valuaciones disponibles</p>
            <IonButton onClick={loadValuations}>
              <IonIcon slot="start" icon={refresh} />
              Reintentar
            </IonButton>
          </div>
        ) : (
          <div className="valuations-container">
            {valuations.map((valuation) => (
              <IonCard
                key={valuation.uuid}
                button
                onClick={() => history.push(`/valuations/${valuation.uuid}`)}
                className="valuation-card"
              >
                <IonCardHeader>
                  <div className="card-header">
                    <IonCardTitle>
                      {(() => {
                        // Mostrar el nombre de la persona (nombre + apellido)
                        const customerName = valuation.appointment?.customer?.name || '';
                        const customerLastName = valuation.appointment?.customer?.last_name || '';
                        
                        if (customerName || customerLastName) {
                          return `${customerName} ${customerLastName}`.trim();
                        }
                        
                        // Fallback: usar UUID si no hay nombre
                        return `Valuación #${valuation.uuid.substring(0, 8)}`;
                      })()}
                    </IonCardTitle>
                    <IonBadge color={getStatusColor(valuation.status)}>
                      {getStatusText(valuation.status)}
                    </IonBadge>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <div className="valuation-info">
                    <div className="info-row compact">
                      <IonIcon icon={calendarOutline} className="info-icon" />
                      <span className="info-value-inline">{formatDate(valuation.created_at)}</span>
                      {(() => {
                        // Mostrar el modelo del auto en lugar del kilometraje
                        const modelName = valuation.vehicle?.model?.name || 
                                         (typeof valuation.vehicle?.model === 'string' ? valuation.vehicle.model : '') ||
                                         valuation.appointment?.vehicle?.model_name || '';
                        return modelName ? (
                          <>
                            <span className="info-separator">•</span>
                            <IonIcon icon={carOutline} className="info-icon-small" />
                            <span className="info-value-inline">{modelName}</span>
                          </>
                        ) : null;
                      })()}
                    </div>
                    {valuation.dealership && (
                      <div className="info-row compact">
                        <span className="info-value-inline">{valuation.dealership.name}</span>
                      </div>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/valuations/new')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonAlert
          isOpen={!!error}
          onDidDismiss={() => setError('')}
          header="Error"
          message={error}
          buttons={['Aceptar']}
        />
      </IonContent>
    </IonPage>
  );
};

export default ValuationList;

