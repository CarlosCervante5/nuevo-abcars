import React, { useEffect, useMemo, useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonNote,
  IonFooter,
} from '@ionic/react';
import { close, flashOutline } from 'ionicons/icons';
import { VehicleImage } from '../models/Vehicle';
import { CameraImage } from '../utils/camera';
import type { BatchImageTarget } from '../services/vehicleImageAiBatch.types';
import './BatchAiProcessModal.css';

/** Debe coincidir con vehicleImageAiBatchService (una foto a la vez). */
const BATCH_HINT = 'una foto a la vez';

export type BatchSelectionKey = string;

function existingKey(uuid: string): BatchSelectionKey {
  return `existing:${uuid}`;
}

function newKey(index: number): BatchSelectionKey {
  return `new:${index}`;
}

interface BatchAiProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleLabel: string;
  existingImages: VehicleImage[];
  newImages: CameraImage[];
  onConfirmStart: (targets: BatchImageTarget[]) => void;
}

const BatchAiProcessModal: React.FC<BatchAiProcessModalProps> = ({
  isOpen,
  onClose,
  vehicleLabel,
  existingImages,
  newImages,
  onConfirmStart,
}) => {
  const selectableKeys = useMemo(() => {
    const keys: BatchSelectionKey[] = [];
    existingImages.forEach((img) => {
      if (img.service_image_url || img.image_path) {
        keys.push(existingKey(img.uuid));
      }
    });
    newImages.forEach((img, i) => {
      if (img.file) {
        keys.push(newKey(i));
      }
    });
    return keys;
  }, [existingImages, newImages]);

  const [selected, setSelected] = useState<Set<BatchSelectionKey>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(selectableKeys));
    }
  }, [isOpen, selectableKeys]);

  const allSelected =
    selectableKeys.length > 0 && selectableKeys.every((k) => selected.has(k));

  const toggleKey = (key: BatchSelectionKey, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableKeys));
    }
  };

  const buildTargets = (): BatchImageTarget[] => {
    const out: BatchImageTarget[] = [];
    existingImages.forEach((img, idx) => {
      const key = existingKey(img.uuid);
      if (!selected.has(key)) return;
      const url = img.service_image_url || img.image_path || '';
      if (!url) return;
      out.push({
        kind: 'existing',
        imageUuid: img.uuid,
        slotIndex: idx,
        remoteUrl: url,
        label: `Foto ${img.sort_id ?? idx + 1} (galería)`,
      });
    });
    newImages.forEach((img, i) => {
      const key = newKey(i);
      if (!selected.has(key) || !img.file) return;
      out.push({
        kind: 'new',
        localId: `new_${i}`,
        file: img.file,
        label: `Nueva foto ${i + 1}`,
      });
    });
    return out;
  };

  const handleStart = () => {
    const targets = buildTargets();
    if (!targets.length) return;
    onConfirmStart(targets);
  };

  const selectedCount = selectableKeys.filter((k) => selected.has(k)).length;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="batch-ai-modal">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Procesar con IA</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p className="batch-ai-intro">
          Elige las fotos de <strong>{vehicleLabel}</strong>. Se procesarán en segundo plano (
          {BATCH_HINT}) con ciclorama ABCars. Con muchas fotos puede tardar varios minutos; el
          avance se verá en el banner amarillo.
        </p>
        {selectableKeys.length === 0 ? (
          <IonNote color="medium">No hay fotos para procesar.</IonNote>
        ) : (
          <>
            <IonButton fill="outline" size="small" onClick={toggleAll} className="batch-ai-toggle-all">
              {allSelected ? 'Quitar todas' : 'Seleccionar todas'}
            </IonButton>
            <IonList className="batch-ai-list">
              {existingImages.map((img, idx) => {
                const url = img.service_image_url || img.image_path;
                if (!url) return null;
                const key = existingKey(img.uuid);
                return (
                  <IonItem key={img.uuid} lines="full">
                    <IonCheckbox
                      slot="start"
                      checked={selected.has(key)}
                      onIonChange={(e) => toggleKey(key, Boolean(e.detail.checked))}
                    />
                    <IonLabel>
                      <h3>Foto {img.sort_id ?? idx + 1}</h3>
                      <p>En galería</p>
                    </IonLabel>
                    <img src={url} alt="" className="batch-ai-thumb" slot="end" />
                  </IonItem>
                );
              })}
              {newImages.map((img, i) => {
                if (!img.file) return null;
                const key = newKey(i);
                return (
                  <IonItem key={key} lines="full">
                    <IonCheckbox
                      slot="start"
                      checked={selected.has(key)}
                      onIonChange={(e) => toggleKey(key, Boolean(e.detail.checked))}
                    />
                    <IonLabel>
                      <h3>Nueva foto {i + 1}</h3>
                      <p>Pendiente de subir</p>
                    </IonLabel>
                    <img src={img.webPath} alt="" className="batch-ai-thumb" slot="end" />
                  </IonItem>
                );
              })}
            </IonList>
          </>
        )}
      </IonContent>
      <IonFooter className="batch-ai-footer">
        <IonToolbar>
          <IonButton
            expand="block"
            color="warning"
            disabled={selectedCount === 0}
            onClick={handleStart}
          >
            <IonIcon icon={flashOutline} slot="start" />
            Procesar {selectedCount} foto{selectedCount === 1 ? '' : 's'} en segundo plano
          </IonButton>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
};

export default BatchAiProcessModal;
