import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonToolbar,
  RefresherEventDetail,
} from '@ionic/react';
import {
  arrowBackOutline,
  carSportOutline,
  checkmarkCircle,
  locationOutline,
  timeOutline,
  waterOutline,
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import {
  carwashService,
  CarWashCustomerStatus,
  CarWashTimelineStep,
} from '../../services/carwashService';
import './CarWashHome.css';

const STORAGE_PHONE = 'carwash_customer_phone';

function formatWhen(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const CarWashHome: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [phone, setPhone] = useState(() => {
    return query.get('phone') || localStorage.getItem(STORAGE_PHONE) || '';
  });
  const [inputPhone, setInputPhone] = useState(phone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CarWashCustomerStatus | null>(null);

  const load = useCallback(
    async (phoneValue: string) => {
      const cleaned = phoneValue.replace(/\D+/g, '');
      if (cleaned.length < 10) {
        setError('Ingresa tu celular a 10 dígitos');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const uuid = query.get('appointment') || query.get('uuid') || undefined;
        const res = await carwashService.getCustomerStatus(cleaned, uuid || undefined);
        setData(res);
        localStorage.setItem(STORAGE_PHONE, cleaned);
        setPhone(cleaned);
      } catch (e: any) {
        setError(e?.message || 'No se pudo cargar tu estatus');
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    if (phone.replace(/\D+/g, '').length >= 10) {
      load(phone);
    }
  }, []);

  const onRefresh = async (ev: CustomEvent<RefresherEventDetail>) => {
    if (phone) await load(phone);
    ev.detail.complete();
  };

  const appointment = data?.appointment;
  const loyalty = data?.loyalty;
  const stamps = loyalty?.stamps_count ?? 0;
  const slots = loyalty?.slots ?? 10;

  return (
    <IonPage className="cw-home">
      <IonHeader className="ion-no-border">
        <IonToolbar className="cw-toolbar">
          <div className="cw-toolbar-inner">
            <button type="button" className="cw-back" onClick={() => history.push('/inventory')}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <div className="cw-toolbar-title">
              <span>CarWash</span>
              <small>ABCars</small>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="cw-content" fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="cw-hero">
          <div className="cw-hero-glow" />
          <p className="cw-hero-kicker">Tu lavado en vivo</p>
          <h1>Sigue tu auto y tu cuponera</h1>
          <p className="cw-hero-sub">Consulta el avance del servicio y los sellos acumulados.</p>
        </div>

        <section className="cw-panel cw-phone-panel">
          <label className="cw-label">Celular de la cita</label>
          <div className="cw-phone-row">
            <IonInput
              className="cw-phone-input"
              type="tel"
              inputmode="numeric"
              maxlength={14}
              value={inputPhone}
              placeholder="81 2916 1594"
              onIonInput={(e) => setInputPhone(String(e.detail.value ?? ''))}
            />
            <IonButton className="cw-btn-go" onClick={() => load(inputPhone)} disabled={loading}>
              {loading ? <IonSpinner name="crescent" /> : 'Ver'}
            </IonButton>
          </div>
          {error ? <p className="cw-error">{error}</p> : null}
        </section>

        {loading && !data ? (
          <div className="cw-loading">
            <IonSpinner name="crescent" color="warning" />
          </div>
        ) : null}

        {data ? (
          <>
            <section className="cw-panel cw-appt">
              <div className="cw-panel-head">
                <IonIcon icon={waterOutline} />
                <h2>Tu cita</h2>
              </div>

              {appointment ? (
                <>
                  <div className="cw-status-pill" data-status={appointment.status}>
                    {appointment.status_label}
                  </div>
                  <h3 className="cw-service">{appointment.service_type?.name || 'Servicio CarWash'}</h3>
                  <div className="cw-meta-grid">
                    <div>
                      <IonIcon icon={timeOutline} />
                      <span>{appointment.scheduled_local || formatWhen(appointment.scheduled_start_at)}</span>
                    </div>
                    <div>
                      <IonIcon icon={locationOutline} />
                      <span>{appointment.location?.name || 'Sede CarWash'}</span>
                    </div>
                    <div>
                      <IonIcon icon={carSportOutline} />
                      <span>
                        {[appointment.vehicle_brand, appointment.vehicle_model, appointment.vehicle_plates]
                          .filter(Boolean)
                          .join(' · ') || 'Vehículo'}
                      </span>
                    </div>
                  </div>
                  {appointment.customer_name ? (
                    <p className="cw-customer">Hola, {appointment.customer_name}</p>
                  ) : null}
                </>
              ) : (
                <p className="cw-empty">No hay una cita activa con ese teléfono. Puedes agendar por WhatsApp.</p>
              )}
            </section>

            <section className="cw-panel cw-timeline-panel">
              <div className="cw-panel-head">
                <h2>Proceso del auto</h2>
              </div>
              <ol className="cw-timeline">
                {(data.timeline || []).map((step: CarWashTimelineStep) => (
                  <li
                    key={step.key}
                    className={[
                      'cw-tl-item',
                      step.done ? 'is-done' : '',
                      step.current ? 'is-current' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className="cw-tl-dot">
                      {step.done ? <IonIcon icon={checkmarkCircle} /> : null}
                    </span>
                    <div className="cw-tl-body">
                      <strong>{step.label}</strong>
                      <small>{step.at ? formatWhen(step.at) : step.current ? 'En curso' : 'Pendiente'}</small>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="cw-panel cw-loyalty">
              <div className="cw-panel-head">
                <h2>Cuponera</h2>
                <span className="cw-loyalty-count">
                  {stamps}/{slots}
                </span>
              </div>
              <p className="cw-loyalty-reward">{loyalty?.reward_text || 'Acumula sellos y gana tu recompensa'}</p>

              <div className="cw-punch" aria-label={`Cuponera ${stamps} de ${slots}`}>
                {Array.from({ length: slots }).map((_, i) => (
                  <div key={i} className={`cw-stamp ${i < stamps ? 'is-filled' : ''}`}>
                    {i < stamps ? '🛒' : ''}
                  </div>
                ))}
              </div>

              <p className="cw-loyalty-foot">
                {loyalty?.remaining && loyalty.remaining > 0
                  ? `Te faltan ${loyalty.remaining} visita(s)`
                  : stamps >= slots
                    ? '¡Tarjeta completa! Canjea en sede'
                    : loyalty?.message || ''}
              </p>
              {(loyalty?.completed_cycles || 0) > 0 ? (
                <p className="cw-cycles">Tarjetas completadas: {loyalty?.completed_cycles}</p>
              ) : null}
            </section>
          </>
        ) : null}

        <div className="cw-bottom-space" />
      </IonContent>
    </IonPage>
  );
};

export default CarWashHome;
