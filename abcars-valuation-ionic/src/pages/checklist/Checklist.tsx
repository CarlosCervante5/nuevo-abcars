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
import { checkmarkCircle, save, informationCircle, cameraOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { valuationService } from '../../services/valuationService';
import { Checkpoint, CHECKLIST_SECTIONS, ChecklistSection } from '../../models';
import './Checklist.css';

const Checklist: React.FC = () => {
  const { valuationUuid } = useParams<{ valuationUuid: string }>();
  const [selectedSection, setSelectedSection] = useState<ChecklistSection>(
    CHECKLIST_SECTIONS[0]
  );
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const history = useHistory();

  useEffect(() => {
    if (valuationUuid) {
      loadChecklist();
    }
  }, [valuationUuid, selectedSection]);

  const loadChecklist = async () => {
    if (!valuationUuid) return;

    try {
      setLoading(true);
      const response = await valuationService.getChecklist(valuationUuid, selectedSection);
      if (response.status === 200) {
        setCheckpoints(response.data);
      }
    } catch (error: any) {
      setToastMessage('Error al cargar checklist');
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
      await valuationService.updateCheckpoint(valuationUuid, checkpointUuid, selectedValue);
      
      // Actualizar estado local
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

  const getProgress = () => {
    const completed = checkpoints.filter((cp) => cp.selected_value).length;
    return checkpoints.length > 0 ? (completed / checkpoints.length) * 100 : 0;
  };

  const handleOpenExternalPhotos = () => {
    if (!valuationUuid) return;
    history.push(`/valuations/${valuationUuid}/photos/exterior`);
  };

  const handleOpenInternalPhotos = () => {
    if (!valuationUuid) return;
    history.push(`/valuations/${valuationUuid}/photos/interior`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/valuations" />
          </IonButtons>
          <IonTitle>Checklist de Valuación</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="checklist-container">
          <div className="sticky-header">
            <IonSegment
              value={selectedSection}
              onIonChange={(e) => setSelectedSection(e.detail.value as ChecklistSection)}
              scrollable
            >
              {CHECKLIST_SECTIONS.map((section) => (
                <IonSegmentButton key={section} value={section}>
                  <IonLabel>{section}</IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>

            <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${getProgress()}%` }}
            />
            <span className="progress-text">
              {checkpoints.filter((cp) => cp.selected_value).length} / {checkpoints.length}
            </span>
            </div>
          </div>

          {loading ? (
            <IonLoading isOpen={loading} message="Cargando checklist..." />
          ) : (
            <>
              <IonList>
                {checkpoints.map((checkpoint) => (
                  <IonCard key={checkpoint.uuid}>
                    <IonCardHeader>
                      <div className="checkpoint-title-container">
                        <IonCardTitle>{checkpoint.name}</IonCardTitle>
                        {checkpoint.description && (
                          <IonIcon
                            icon={informationCircle}
                            className={`info-icon ${expandedDescriptions.has(checkpoint.uuid) ? 'expanded' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedDescriptions((prev) => {
                                const newSet = new Set(prev);
                                if (newSet.has(checkpoint.uuid)) {
                                  newSet.delete(checkpoint.uuid);
                                } else {
                                  newSet.add(checkpoint.uuid);
                                }
                                return newSet;
                              });
                            }}
                          />
                        )}
                      </div>
                      {checkpoint.description && expandedDescriptions.has(checkpoint.uuid) && (
                        <p className="checkpoint-description-caption">{checkpoint.description}</p>
                      )}
                    </IonCardHeader>
                    <IonCardContent>
                      <IonItem>
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
                ))}
              </IonList>

              {/* Botones de fotos por sección */}
              {selectedSection === 'Revisión Exterior' && (
                <div className="photo-section-button">
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={handleOpenExternalPhotos}
                    className="ion-margin-top"
                  >
                    <IonIcon icon={cameraOutline} slot="start" />
                    Foto Exterior
                  </IonButton>
                </div>
              )}

              {selectedSection === 'Revisión Interior' && (
                <div className="photo-section-button">
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={handleOpenInternalPhotos}
                    className="ion-margin-top"
                  >
                    <IonIcon icon={cameraOutline} slot="start" />
                    Foto Interior
                  </IonButton>
                </div>
              )}
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

export default Checklist;

