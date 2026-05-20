import React, { useEffect, useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
} from '@ionic/react';
import { closeOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import './ImageLightbox.css';

export interface ImageLightboxProps {
  isOpen: boolean;
  urls: string[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  urls,
  initialIndex = 0,
  title = 'Imagen',
  onClose,
}) => {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      const safe = Math.min(Math.max(0, initialIndex), Math.max(0, urls.length - 1));
      setIndex(safe);
    }
  }, [isOpen, initialIndex, urls.length]);

  if (urls.length === 0) {
    return null;
  }

  const currentUrl = urls[index] ?? urls[0];
  const hasPrev = index > 0;
  const hasNext = index < urls.length - 1;

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      className="image-lightbox-modal"
      backdropDismiss
    >
      <IonHeader className="image-lightbox-header">
        <IonToolbar color="dark">
          <IonTitle>
            {urls.length > 1 ? `${title} ${index + 1} / ${urls.length}` : title}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} aria-label="Cerrar">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="image-lightbox-content" color="dark">
        <div className="image-lightbox-stage">
          {hasPrev && (
            <IonButton
              fill="clear"
              className="image-lightbox-nav image-lightbox-nav--prev"
              onClick={() => setIndex((i) => i - 1)}
              aria-label="Anterior"
            >
              <IonIcon icon={chevronBackOutline} />
            </IonButton>
          )}
          <img
            src={currentUrl}
            alt={`${title} ${index + 1}`}
            className="image-lightbox-img"
          />
          {hasNext && (
            <IonButton
              fill="clear"
              className="image-lightbox-nav image-lightbox-nav--next"
              onClick={() => setIndex((i) => i + 1)}
              aria-label="Siguiente"
            >
              <IonIcon icon={chevronForwardOutline} />
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ImageLightbox;
