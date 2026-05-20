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
import PhotoGuideIllustration from './PhotoGuideIllustration';
import { PHOTO_GUIDE_ENTRIES, type PhotoGuideCategory } from '../config/photoGuideDefinitions';
import './PhotoGuideModal.css';

interface PhotoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PhotoGuideModal: React.FC<PhotoGuideModalProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | PhotoGuideCategory>('all');

  const filteredGuides =
    selectedCategory === 'all'
      ? PHOTO_GUIDE_ENTRIES
      : PHOTO_GUIDE_ENTRIES.filter((g) => g.category === selectedCategory);

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

        <IonSegment
          value={selectedCategory}
          onIonChange={(e) => setSelectedCategory(e.detail.value as 'all' | PhotoGuideCategory)}
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

        <div className="guides-grid">
          {filteredGuides.map((guide) => (
            <IonCard key={guide.id} className="guide-card">
              <IonCardHeader>
                <IonCardTitle className="guide-number">{guide.id}.-</IonCardTitle>
                <IonCardTitle className="guide-title">{guide.title}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <PhotoGuideIllustration type={guide.type} title={guide.title} variant="card" />
              </IonCardContent>
            </IonCard>
          ))}
        </div>

        <IonButton expand="block" color="primary" onClick={onClose} className="close-guide-button">
          Entendido, Cerrar Guía
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default PhotoGuideModal;
