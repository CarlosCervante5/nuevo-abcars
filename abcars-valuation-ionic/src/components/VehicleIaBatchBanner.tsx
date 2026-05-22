import React, { useEffect, useState } from 'react';
import { IonCard, IonCardContent, IonIcon, IonNote, IonProgressBar, IonSpinner } from '@ionic/react';
import { flashOutline } from 'ionicons/icons';
import {
  vehicleImageAiBatchService,
} from '../services/vehicleImageAiBatchService';
import type { BatchJob } from '../services/vehicleImageAiBatch.types';
import './VehicleIaBatchBanner.css';

interface VehicleIaBatchBannerProps {
  vehicleUuid?: string;
}

const VehicleIaBatchBanner: React.FC<VehicleIaBatchBannerProps> = ({ vehicleUuid }) => {
  const [jobs, setJobs] = useState<BatchJob[]>([]);

  const refresh = () => {
    const active = vehicleImageAiBatchService.getActiveJobs();
    if (vehicleUuid) {
      setJobs(active.filter((j) => j.vehicleUuid === vehicleUuid));
    } else {
      setJobs(active);
    }
  };

  useEffect(() => {
    refresh();
    return vehicleImageAiBatchService.subscribe(refresh);
  }, [vehicleUuid]);

  if (!jobs.length) {
    return null;
  }

  return (
    <div className="vehicle-ia-batch-banners">
      {jobs.map((job) => {
        const progress =
          job.total > 0
            ? job.status === 'saving'
              ? Math.min(1, 0.55 + (job.saved / job.total) * 0.45)
              : Math.min(1, (job.geminiDone / job.total) * 0.55)
            : 0;
        const phase =
          job.status === 'saving'
            ? 'Guardando en servidor…'
            : `IA en paralelo: ${job.geminiDone}/${job.total}`;
        return (
          <IonCard key={job.id} className="vehicle-ia-batch-card" color="warning">
            <IonCardContent>
              <div className="vehicle-ia-batch-card__row">
                <IonSpinner name="crescent" />
                <div>
                  <strong>
                    <IonIcon icon={flashOutline} className="vehicle-ia-batch-card__icon" />
                    Procesando {job.vehicleLabel}
                  </strong>
                  <IonNote className="vehicle-ia-batch-card__note">{phase}</IonNote>
                </div>
              </div>
              <IonProgressBar value={progress} />
              <IonNote className="vehicle-ia-batch-card__hint">
                Puedes salir de esta pantalla y continuar con la siguiente unidad.
              </IonNote>
            </IonCardContent>
          </IonCard>
        );
      })}
    </div>
  );
};

export default VehicleIaBatchBanner;
