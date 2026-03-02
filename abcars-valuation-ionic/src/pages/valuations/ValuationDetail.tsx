import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonLoading,
  IonAlert,
  IonBackButton,
  IonButtons,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  useIonViewWillEnter,
  IonModal,
  IonFooter,
} from '@ionic/react';
import {
  carOutline,
  calendarOutline,
  locationOutline,
  constructOutline,
  cubeOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  downloadOutline,
} from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { valuationService } from '../../services/valuationService';
import { Valuation } from '../../models';
import './ValuationDetail.css';

const ValuationDetail: React.FC = () => {
  const { valuationUuid } = useParams<{ valuationUuid: string }>();
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPdf, setShowPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const history = useHistory();

  useEffect(() => {
    if (valuationUuid) {
      loadValuationDetail();
    }
  }, [valuationUuid]);

  useIonViewWillEnter(() => {
    if (valuationUuid) {
      loadValuationDetail();
    }
  });

  const loadValuationDetail = async () => {
    if (!valuationUuid) return;

    try {
      setLoading(true);
      const response = await valuationService.getValuationDetail(valuationUuid);
      if (response.status === 200 && response.data) {
        setValuation(response.data);
      } else {
        setError('No se pudo cargar la valuación');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar la valuación');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      currencyDisplay: 'code',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checklist_ready':
        return 'success';
      case 'to_appraise':
        return 'warning';
      case 'completed':
        return 'primary';
      case 'valuated':
        return 'medium';
      case 'on_progress':
        return 'tertiary';
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

  const shouldShowAcquisitionChecklist = (status?: string, statusParts?: string) =>
    (status === 'checklist_ready' && statusParts === 'parts_done') ||
    status === 'valuated' ||
    status === 'complete_file';

  const shouldShowValuar = (status?: string, statusParts?: string) =>
    (status === 'checklist_ready' && statusParts === 'parts_done') || status === 'valuated';

  const shouldShowDownloadValuation = (status?: string) =>
    status === 'valuated' || status === 'complete_file';

  const handleDownloadValuation = async () => {
    if (!valuationUuid) return;
    try {
      const blob = await valuationService.downloadValuationPdf(valuationUuid);
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setShowPdf(true);
    } catch (err: any) {
      setError(err?.message || 'Error al descargar la valuación');
    }
  };

  const handleClosePdf = () => {
    setShowPdf(false);
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const handlePrintPdf = () => {
    try {
      iframeRef.current?.contentWindow?.print();
    } catch (err) {
      window.print();
    }
  };

  const getPartsStatusClass = (status?: string) => {
    switch (status) {
      case 'parts_done':
        return 'status-dot-green';
      case 'pending_review':
        return 'status-dot-red';
      case 'on_hold':
      case 'pending_entry':
        return 'status-dot-gray';
      default:
        return 'status-dot-gray';
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/valuations" />
            </IonButtons>
            <IonTitle>Detalle de Valuación</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonLoading isOpen={loading} message="Cargando..." />
        </IonContent>
      </IonPage>
    );
  }

  if (!valuation) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/valuations" />
            </IonButtons>
            <IonTitle>Detalle de Valuación</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="error-state">
            <p>{error || 'Valuación no encontrada'}</p>
            <IonButton onClick={loadValuationDetail}>Reintentar</IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/valuations" />
          </IonButtons>
          <IonTitle>Detalle de Valuación</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="valuation-detail-container">
          {/* Información del Vehículo */}
          <IonCard>
            <IonCardHeader>
              <div className="card-header">
                <IonCardTitle>
                  <IonIcon icon={carOutline} />{' '}
                  {(() => {
                    const brand =
                      valuation.vehicle?.brand?.name ||
                      valuation.appointment?.vehicle?.brand_name ||
                      '';
                    const model =
                      valuation.vehicle?.model?.name ||
                      valuation.appointment?.vehicle?.model_name ||
                      '';
                    return `${brand} ${model}`.trim() || 'Vehículo';
                  })()}
                </IonCardTitle>
                <IonBadge color={getStatusColor(valuation.status)}>
                  {getStatusText(valuation.status)}
                </IonBadge>
              </div>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol size="6">
                    <IonItem lines="none">
                      <IonLabel>
                        <h3>Año</h3>
                        <p>
                          {valuation.vehicle?.year ||
                            valuation.appointment?.vehicle?.year ||
                            'N/A'}
                        </p>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="6">
                    <IonItem lines="none">
                      <IonLabel>
                        <h3>Kilometraje</h3>
                        <p>
                          {(valuation.vehicle?.mileage ??
                            valuation.appointment?.vehicle?.mileage) !==
                          undefined
                            ? `${(
                                valuation.vehicle?.mileage ??
                                valuation.appointment?.vehicle?.mileage ??
                                0
                              ).toLocaleString()} km`
                            : 'N/A'}
                        </p>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonItem lines="none">
                      <IonLabel>
                        <h3>VIN</h3>
                        <p className="vin-value">{valuation.vehicle?.vin || 'N/A'}</p>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="6">
                    <IonItem lines="none">
                      <IonIcon icon={locationOutline} slot="start" />
                      <IonLabel>
                        <h3>Sucursal</h3>
                        <p>{valuation.dealership?.name || 'N/A'}</p>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="6">
                    <IonItem lines="none">
                      <IonLabel>
                        <div className="status-dot-row">
                          <span className="status-dot-label">Refacciones</span>
                          <span
                            className={`status-dot ${getPartsStatusClass(
                              valuation.status_parts
                            )}`}
                            aria-label="Estatus de refacciones"
                          />
                        </div>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>

          {/* Precios y Ofertas */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Precios y Ofertas</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol size="6">
                    <IonItem lines="none">
                      <IonLabel>
                        <h3>Oferta de Compra (Libro)</h3>
                        <p className="price">{formatCurrency(valuation.book_trade_in_offer)}</p>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="6">
                    <IonItem lines="none">
                      <IonLabel>
                        <h3>Precio de Venta (Libro)</h3>
                        <p className="price">{formatCurrency(valuation.book_sale_price)}</p>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="6">
                    <IonItem lines="none">
                      <IonLabel>
                        <h3>Oferta Final</h3>
                        <p className="price highlight">{formatCurrency(valuation.final_offer)}</p>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="6">
                    <IonItem lines="none">
                      <IonLabel>
                        <h3>Total Estimado</h3>
                        <p className="price">{formatCurrency(valuation.estimated_total)}</p>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>

          {/* Costos */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Costos</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol size="6">
                    <IonItem lines="none">
                      <IonLabel>
                        <h3>Mano de Obra</h3>
                        <p>{formatCurrency(valuation.labor_cost)}</p>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="6">
                    <IonItem lines="none">
                      <IonLabel>
                        <h3>Refacciones</h3>
                        <p>{formatCurrency(valuation.spare_parts_cost)}</p>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="6">
                    <IonItem lines="none">
                      <IonLabel>
                        <h3>Carrocería y Pintura</h3>
                        <p>{formatCurrency(valuation.body_work_painting_cost)}</p>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>

          {/* Acciones */}
          <div className="actions-container">
            <IonButton
              expand="block"
              color="primary"
              onClick={() => history.push(`/valuations/${valuationUuid}/checklist`)}
            >
              <IonIcon icon={checkmarkCircleOutline} slot="start" />
              Checklist de Valuación
            </IonButton>

            {shouldShowDownloadValuation(valuation.status) && (
              <IonButton expand="block" color="medium" onClick={handleDownloadValuation}>
                <IonIcon icon={downloadOutline} slot="start" />
                Descargar Valuación
              </IonButton>
            )}

            {shouldShowValuar(valuation.status, valuation.status_parts) && (
              <IonButton
                expand="block"
                color="success"
                onClick={() => history.push(`/valuations/${valuationUuid}/quote-request`)}
              >
                <IonIcon icon={calendarOutline} slot="start" />
                Valuar
              </IonButton>
            )}

            {shouldShowAcquisitionChecklist(valuation.status, valuation.status_parts) && (
              <IonButton
                expand="block"
                color="secondary"
                onClick={() => history.push(`/valuations/${valuationUuid}/acquisition`)}
              >
                <IonIcon icon={documentTextOutline} slot="start" />
                Checklist de Adquisición
              </IonButton>
            )}

            <IonButton
              expand="block"
              color="tertiary"
              onClick={() => history.push(`/valuations/${valuationUuid}/repairs`)}
            >
              <IonIcon icon={constructOutline} slot="start" />
              Reparaciones
            </IonButton>

            <IonButton
              expand="block"
              color="medium"
              onClick={() => history.push(`/valuations/${valuationUuid}/parts`)}
            >
              <IonIcon icon={cubeOutline} slot="start" />
              Refacciones
            </IonButton>
          </div>
        </div>

        <IonAlert
          isOpen={!!error}
          onDidDismiss={() => setError('')}
          header="Error"
          message={error}
          buttons={['Aceptar']}
        />
        <IonModal isOpen={showPdf} onDidDismiss={handleClosePdf} className="valuation-pdf-modal">
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>Valuación</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={handleClosePdf}>Cerrar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {pdfUrl && (
              <iframe
                ref={iframeRef}
                src={pdfUrl}
                title="Valuación PDF"
                className="valuation-pdf-frame"
              />
            )}
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <IonButtons slot="end">
                <IonButton onClick={handlePrintPdf}>Imprimir</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonFooter>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default ValuationDetail;

