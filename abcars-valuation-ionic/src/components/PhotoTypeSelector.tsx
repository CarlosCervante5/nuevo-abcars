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
import './PhotoTypeSelector.css';

export type PhotoGuideType = 
  | 'frontal_izquierda' | 'lateral_izquierda' | 'posterior_izquierda' | 'posterior' | 'posterior_derecha'
  | 'lateral_derecha' | 'frontal_derecha' | 'frontal'
  | 'interior' | 'asientos_delanteros' | 'asientos_traseros' | 'vista_cabina' | 'vista_conductor' | 'odometro' | 'controles'
  | 'luces_interiores' | 'palanca_velocidades' | 'faros_delanteros' | 'llantas' | 'luces_traseras'
  | 'logotipo_marca' | 'motor' | 'logotipo_modelo' | 'cajuela' | 'quemacocos' | 'llaves';

interface PhotoType {
  id: number;
  type: PhotoGuideType;
  title: string;
  category: 'exterior' | 'interior' | 'details';
}

interface PhotoTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: PhotoGuideType, title: string) => void;
}

const PhotoTypeSelector: React.FC<PhotoTypeSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'exterior' | 'interior' | 'details'>('all');

  const photoTypes: PhotoType[] = [
    // Exterior
    { id: 1, type: 'frontal_izquierda', title: 'Frontal Izquierda', category: 'exterior' },
    { id: 2, type: 'lateral_izquierda', title: 'Lateral Izquierda', category: 'exterior' },
    { id: 3, type: 'posterior_izquierda', title: 'Posterior Izquierda', category: 'exterior' },
    { id: 4, type: 'posterior', title: 'Posterior', category: 'exterior' },
    { id: 5, type: 'posterior_derecha', title: 'Posterior Derecha', category: 'exterior' },
    { id: 6, type: 'lateral_derecha', title: 'Lateral Derecha', category: 'exterior' },
    { id: 7, type: 'frontal_derecha', title: 'Frontal Derecha', category: 'exterior' },
    { id: 8, type: 'frontal', title: 'Frontal', category: 'exterior' },
    // Interior
    { id: 9, type: 'interior', title: 'Interior', category: 'interior' },
    { id: 10, type: 'asientos_delanteros', title: 'Asientos Delanteros', category: 'interior' },
    { id: 11, type: 'asientos_traseros', title: 'Asientos Traseros', category: 'interior' },
    { id: 12, type: 'vista_cabina', title: 'Vista Cabina', category: 'interior' },
    { id: 13, type: 'vista_conductor', title: 'Vista Conductor', category: 'interior' },
    { id: 14, type: 'odometro', title: 'Odómetro', category: 'interior' },
    { id: 15, type: 'controles', title: 'Controles', category: 'interior' },
    // Detalles
    { id: 16, type: 'luces_interiores', title: 'Luces Interiores', category: 'details' },
    { id: 17, type: 'palanca_velocidades', title: 'Palanca de velocidades', category: 'details' },
    { id: 18, type: 'faros_delanteros', title: 'Faros Delanteros', category: 'details' },
    { id: 19, type: 'llantas', title: 'Llantas', category: 'details' },
    { id: 20, type: 'luces_traseras', title: 'Luces traseras', category: 'details' },
    { id: 21, type: 'logotipo_marca', title: 'Logotipo de Marca', category: 'details' },
    { id: 22, type: 'motor', title: 'Motor', category: 'details' },
    { id: 23, type: 'logotipo_modelo', title: 'Logotipo Modelo Versión', category: 'details' },
    { id: 24, type: 'cajuela', title: 'Cajuela', category: 'details' },
    { id: 25, type: 'quemacocos', title: 'Quemacocos o techo panorámico', category: 'details' },
    { id: 26, type: 'llaves', title: 'Llaves', category: 'details' },
  ];

  const filteredTypes = selectedCategory === 'all' 
    ? photoTypes 
    : photoTypes.filter(p => p.category === selectedCategory);

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
        <IonSegment
          value={selectedCategory}
          onIonChange={(e) => setSelectedCategory(e.detail.value as any)}
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
            </IonCard>
          ))}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default PhotoTypeSelector;

