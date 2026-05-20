import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/react';
import { close } from 'ionicons/icons';
import PhotoGuideIllustration from './PhotoGuideIllustration';
import { PHOTO_GUIDE_ENTRIES, type PhotoGuideCategory } from '../config/photoGuideDefinitions';
import './PhotoTypeSelector.css';

export type PhotoGuideType =
  | 'frontal_izquierda' | 'lateral_izquierda' | 'posterior_izquierda' | 'posterior' | 'posterior_derecha'
  | 'lateral_derecha' | 'frontal_derecha' | 'frontal'
  | 'interior' | 'asientos_delanteros' | 'asientos_traseros' | 'vista_cabina' | 'vista_conductor' | 'odometro' | 'controles'
  | 'luces_interiores' | 'palanca_velocidades' | 'faros_delanteros' | 'llantas' | 'luces_traseras'
  | 'logotipo_marca' | 'motor' | 'logotipo_modelo' | 'cajuela' | 'quemacocos' | 'llaves';

interface PhotoTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: PhotoGuideType, title: string) => void;
}

const PhotoTypeSelector: React.FC<PhotoTypeSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | PhotoGuideCategory>('all');

  const filteredTypes =
    selectedCategory === 'all'
      ? PHOTO_GUIDE_ENTRIES
      : PHOTO_GUIDE_ENTRIES.filter((p) => p.category === selectedCategory);

  const handleSelect = (type: PhotoGuideType, title: string) => {
    onSelect(type, title);
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="photo-type-selector-modal">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Seleccionar Tipo de Foto</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="photo-type-selector-content">
        <p className="photo-type-selector-hint">Elige el ángulo o detalle; la misma ilustración aparecerá al tomar la foto.</p>
        <IonSegment
          value={selectedCategory}
          onIonChange={(e) => setSelectedCategory(e.detail.value as 'all' | PhotoGuideCategory)}
          className="type-category-filter"
        >
          <IonSegmentButton value="all">
            <IonLabel>Todas</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="exterior">
            <IonLabel>Exterior</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="interior">
            <IonLabel>Interior</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="details">
            <IonLabel>Detalles</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        <div className="photo-types-grid">
          {filteredTypes.map((photoType) => (
            <IonCard
              key={photoType.id}
              className="photo-type-card"
              button
              onClick={() => handleSelect(photoType.type, photoType.title)}
            >
              <IonCardHeader>
                <IonCardTitle className="photo-type-number">{photoType.id}.-</IonCardTitle>
                <IonCardTitle className="photo-type-title">{photoType.title}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <PhotoGuideIllustration type={photoType.type} title={photoType.title} variant="card" />
              </IonCardContent>
            </IonCard>
          ))}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default PhotoTypeSelector;
