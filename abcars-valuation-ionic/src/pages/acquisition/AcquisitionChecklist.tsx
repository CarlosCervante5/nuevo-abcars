import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonInput,
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
} from '@ionic/react';
import { checkmarkCircle } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { valuationService } from '../../services/valuationService';
import { Checkpoint } from '../../models';
import './AcquisitionChecklist.css';

const AcquisitionChecklist: React.FC = () => {
  const { valuationUuid } = useParams<{ valuationUuid: string }>();
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (valuationUuid) {
      loadChecklist();
    }
  }, [valuationUuid]);

  const loadChecklist = async () => {
    if (!valuationUuid) return;

    try {
      setLoading(true);
      const response = await valuationService.getAcquisitionChecklist(valuationUuid);
      if (response.status === 200) {
        setCheckpoints(response.data);
      }
    } catch (error: any) {
      setToastMessage('Error al cargar checklist de adquisición');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckpointChange = async (
    checkpointUuid: string,
    selectedValue: string
  ) => {
    if (!valuationUuid) return;

    try {
      setSaving(true);
      await valuationService.updateAcquisitionCheckpoint(
        valuationUuid,
        checkpointUuid,
        selectedValue
      );
      
      setCheckpoints((prev) =>
        prev.map((cp) =>
          cp.uuid === checkpointUuid ? { ...cp, selected_value: selectedValue } : cp
        )
      );
      
      setToastMessage('Guardado correctamente');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage('Error al guardar');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const renderCheckpointInput = (checkpoint: Checkpoint) => {
    switch (checkpoint.value_type) {
      case 'select':
        return (
          <IonSelect
            value={checkpoint.selected_value || ''}
            placeholder="Seleccionar"
            onIonChange={(e) =>
              handleCheckpointChange(checkpoint.uuid, e.detail.value)
            }
            interface="popover"
          >
            {checkpoint.values.map((value) => (
              <IonSelectOption key={value} value={value}>
                {value}
              </IonSelectOption>
            ))}
          </IonSelect>
        );

      case 'text':
        return (
          <IonInput
            value={checkpoint.selected_value || ''}
            placeholder="Ingresar texto"
            onIonInput={(e) =>
              handleCheckpointChange(checkpoint.uuid, e.detail.value || '')
            }
          />
        );

      case 'number':
        return (
          <IonInput
            type="number"
            value={checkpoint.selected_value || ''}
            placeholder="Ingresar número"
            onIonInput={(e) =>
              handleCheckpointChange(checkpoint.uuid, e.detail.value || '')
            }
          />
        );

      case 'boolean':
        return (
          <IonButton
            fill={checkpoint.selected_value === 'yes' ? 'solid' : 'outline'}
            color={checkpoint.selected_value === 'yes' ? 'success' : 'medium'}
            onClick={() =>
              handleCheckpointChange(
                checkpoint.uuid,
                checkpoint.selected_value === 'yes' ? 'no' : 'yes'
              )
            }
          >
            {checkpoint.selected_value === 'yes' ? 'Sí' : 'No'}
          </IonButton>
        );

      default:
        return null;
    }
  };

  const renderTenenciaToggles = (tenenciaItems: Checkpoint[]) => {
    const currentYear = new Date().getFullYear();

    return (
      <IonCard key="tenencia-group">
        <IonCardHeader>
          <IonCardTitle>Información de la toma tenencia</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="tenencia-toggle-grid">
            {tenenciaItems.map((item, index) => {
              const yearValue = currentYear - index;
              const isChecked = Boolean(item.selected_value);
              return (
                <label key={item.uuid} className="tenencia-toggle">
                  <input
                    type="checkbox"
                    className="tenencia-toggle-input"
                    checked={isChecked}
                    onChange={(event) =>
                      handleCheckpointChange(
                        item.uuid,
                        event.target.checked ? String(yearValue) : ''
                      )
                    }
                  />
                  <span className="tenencia-toggle-slider" />
                  <span className="tenencia-toggle-label">{yearValue}</span>
                </label>
              );
            })}
          </div>
        </IonCardContent>
      </IonCard>
    );
  };

  const getProgress = () => {
    const completed = checkpoints.filter((cp) => cp.selected_value).length;
    return checkpoints.length > 0 ? (completed / checkpoints.length) * 100 : 0;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/valuations" />
          </IonButtons>
          <IonTitle>Checklist de Adquisición</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="checklist-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${getProgress()}%` }}
            />
            <span className="progress-text">
              {checkpoints.filter((cp) => cp.selected_value).length} / {checkpoints.length}
            </span>
          </div>

          {loading ? (
            <IonLoading isOpen={loading} message="Cargando checklist..." />
          ) : (
            <IonList>
              {(() => {
                const tenenciaItems = checkpoints.filter(
                  (cp) => cp.section_name === 'Información de la toma tenencia'
                );
                let tenenciaRendered = false;

                return checkpoints.map((checkpoint) => {
                  if (checkpoint.section_name === 'Información de la toma tenencia') {
                    if (tenenciaRendered) {
                      return null;
                    }
                    tenenciaRendered = true;
                    return renderTenenciaToggles(tenenciaItems);
                  }

                  return (
                    <IonCard key={checkpoint.uuid}>
                      <IonCardHeader>
                        <IonCardTitle>{checkpoint.name}</IonCardTitle>
                        {checkpoint.description && (
                          <p className="checkpoint-description">{checkpoint.description}</p>
                        )}
                      </IonCardHeader>
                      <IonCardContent>
                        <IonItem>
                          <IonLabel position="stacked">Valor</IonLabel>
                          {renderCheckpointInput(checkpoint)}
                          {checkpoint.selected_value && (
                            <IonIcon
                              icon={checkmarkCircle}
                              color="success"
                              slot="end"
                            />
                          )}
                        </IonItem>
                      </IonCardContent>
                    </IonCard>
                  );
                });
              })()}
            </IonList>
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

export default AcquisitionChecklist;

