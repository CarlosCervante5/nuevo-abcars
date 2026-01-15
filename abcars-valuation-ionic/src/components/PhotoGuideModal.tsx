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
import { close, informationCircle } from 'ionicons/icons';
import './PhotoGuideModal.css';

interface PhotoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PhotoGuide {
  id: number;
  title: string;
  category: 'exterior' | 'interior' | 'details';
}

const PhotoGuideModal: React.FC<PhotoGuideModalProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'exterior' | 'interior' | 'details'>('all');

  const exteriorGuides: PhotoGuide[] = [
    { id: 1, title: 'Frontal Izquierda', category: 'exterior' },
    { id: 2, title: 'Lateral Izquierda', category: 'exterior' },
    { id: 3, title: 'Posterior Izquierda', category: 'exterior' },
    { id: 4, title: 'Posterior', category: 'exterior' },
    { id: 5, title: 'Posterior Derecha', category: 'exterior' },
    { id: 6, title: 'Lateral Derecha', category: 'exterior' },
    { id: 7, title: 'Frontal Derecha', category: 'exterior' },
    { id: 8, title: 'Frontal', category: 'exterior' },
  ];

  const interiorGuides: PhotoGuide[] = [
    { id: 9, title: 'Interior', category: 'interior' },
    { id: 10, title: 'Asientos Delanteros', category: 'interior' },
    { id: 11, title: 'Asientos Traseros', category: 'interior' },
    { id: 12, title: 'Vista Cabina', category: 'interior' },
    { id: 13, title: 'Vista Conductor', category: 'interior' },
    { id: 14, title: 'Odómetro', category: 'interior' },
    { id: 15, title: 'Controles', category: 'interior' },
  ];

  const detailGuides: PhotoGuide[] = [
    { id: 16, title: 'Luces Interiores', category: 'details' },
    { id: 17, title: 'Palanca de velocidades', category: 'details' },
    { id: 18, title: 'Faros Delanteros', category: 'details' },
    { id: 19, title: 'Llantas', category: 'details' },
    { id: 20, title: 'Luces traseras', category: 'details' },
    { id: 21, title: 'Logotipo de Marca', category: 'details' },
    { id: 22, title: 'Motor', category: 'details' },
    { id: 23, title: 'Logotipo Modelo Versión', category: 'details' },
    { id: 24, title: 'Cajuela', category: 'details' },
    { id: 25, title: 'Quemacocos o techo panorámico', category: 'details' },
    { id: 26, title: 'Llaves', category: 'details' },
  ];

  const allGuides = [...exteriorGuides, ...interiorGuides, ...detailGuides];

  const filteredGuides = selectedCategory === 'all' 
    ? allGuides 
    : allGuides.filter(g => g.category === selectedCategory);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="photo-guide-modal">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Guía de Fotos del Vehículo</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="photo-guide-content">
        {/* Tip sobre VIN */}
        <IonCard className="vin-tip-card">
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={informationCircle} className="tip-icon" />
              Tip
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p className="tip-text">
              Antes de iniciar las fotos del vehículo, te recomendamos fotografiar el VIN. 
              Aunque esta foto no será publicada, te ayudará en la edición a identificar 
              rápidamente a que serie corresponden las imágenes siguientes.
            </p>
          </IonCardContent>
        </IonCard>

        {/* Filtro por categoría */}
        <IonSegment
          value={selectedCategory}
          onIonChange={(e) => setSelectedCategory(e.detail.value as any)}
          className="guide-category-filter"
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

        {/* Grid de guías */}
        <div className="guides-grid">
          {filteredGuides.map((guide) => (
            <IonCard key={guide.id} className="guide-card">
              <IonCardHeader>
                <IonCardTitle className="guide-number">{guide.id}.-</IonCardTitle>
                <IonCardTitle className="guide-title">{guide.title}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="guide-placeholder">
                  {/* Aquí se podría agregar una ilustración SVG o imagen */}
                  <div className="guide-icon">
                    {guide.category === 'exterior' && '🚗'}
                    {guide.category === 'interior' && '🪑'}
                    {guide.category === 'details' && '🔍'}
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </div>

        <IonButton
          expand="block"
          color="primary"
          onClick={onClose}
          className="close-guide-button"
        >
          Entendido, Cerrar Guía
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default PhotoGuideModal;

