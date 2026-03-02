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
  IonInput,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { close, cardOutline } from 'ionicons/icons';
import { leadService, FinancingFormData } from '../services/leadService';
import { SimulatorData } from './SimulatorModal';
import { Vehicle } from '../models/Vehicle';
import './FinancingFormModal.css';

const DEALERSHIPS = [
  { name: 'Chevrolet Balderrama Serdán (Puebla)' },
  { name: 'VECSA Pachuca' },
];

interface FinancingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: Vehicle | null;
  simulatorData?: SimulatorData | null;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

const FinancingFormModal: React.FC<FinancingFormModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  simulatorData,
  onSuccess,
  onError,
}) => {
  const [form, setForm] = useState({
    name: '',
    last_name: '',
    phone: '',
    email: '',
    city: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!form.last_name.trim()) newErrors.last_name = 'Los apellidos son requeridos';
    if (!form.phone.trim()) newErrors.phone = 'El teléfono es requerido';
    else if (!/^[0-9]{10}$/.test(form.phone.replace(/\s/g, '')))
      newErrors.phone = 'El teléfono debe tener 10 dígitos';
    if (!form.email.trim()) newErrors.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'El email no es válido';
    if (!form.city.trim()) newErrors.city = 'La sucursal es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const comments = simulatorData
        ? `Enganche: ${simulatorData.downPayment.toLocaleString('es-MX')} MXN | Mensualidad: ${simulatorData.monthlyPayment.toLocaleString('es-MX')} MXN | Total: ${simulatorData.totalAmount.toLocaleString('es-MX')} MXN`
        : '';

      const data: FinancingFormData = {
        name: form.name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.replace(/\s/g, ''),
        email: form.email.trim(),
        city: form.city.trim(),
        comments,
        vehicle_brand: vehicle?.brand?.name,
        vehicle_model: vehicle?.model?.name,
        vehicle_year: vehicle?.model?.year,
        vehicle_price: simulatorData?.vehiclePrice ?? vehicle?.sale_price,
        down_payment: simulatorData?.downPayment,
        down_payment_percentage: simulatorData?.downPaymentPercentage,
        monthly_payment: simulatorData?.monthlyPayment,
        term_months: simulatorData?.termMonths,
        finance_amount: simulatorData?.financedAmount,
      };

      const response = await leadService.sendFinancingRequest(data);
      const success = (response as any)?.status === 201 || (response as any)?.success === true;
      if (success) {
        setForm({ name: '', last_name: '', phone: '', email: '', city: '' });
        setErrors({});
        onSuccess?.();
        onClose();
      } else {
        onError?.((response as any)?.message || 'Error al enviar la solicitud');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al enviar la solicitud';
      onError?.(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="financing-form-modal">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>
            <IonIcon icon={cardOutline} className="modal-title-icon" />
            Solicitar financiamiento
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="financing-form">
          <div className="form-field">
            <IonLabel>Nombre *</IonLabel>
            <IonInput
              value={form.name}
              onIonInput={(e) => setForm({ ...form, name: e.detail.value || '' })}
              placeholder="Tu nombre"
              className={errors.name ? 'ion-invalid' : ''}
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-field">
            <IonLabel>Apellidos *</IonLabel>
            <IonInput
              value={form.last_name}
              onIonInput={(e) => setForm({ ...form, last_name: e.detail.value || '' })}
              placeholder="Tus apellidos"
              className={errors.last_name ? 'ion-invalid' : ''}
            />
            {errors.last_name && <span className="form-error">{errors.last_name}</span>}
          </div>

          <div className="form-field">
            <IonLabel>Teléfono *</IonLabel>
            <IonInput
              type="tel"
              inputMode="numeric"
              maxlength={10}
              value={form.phone}
              onIonInput={(e) => setForm({ ...form, phone: (e.detail.value || '').replace(/\D/g, '').slice(0, 10) })}
              placeholder="10 dígitos"
              className={errors.phone ? 'ion-invalid' : ''}
            />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>

          <div className="form-field">
            <IonLabel>Email *</IonLabel>
            <IonInput
              type="email"
              value={form.email}
              onIonInput={(e) => setForm({ ...form, email: e.detail.value || '' })}
              placeholder="tu@email.com"
              className={errors.email ? 'ion-invalid' : ''}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-field">
            <IonLabel>Sucursal *</IonLabel>
            <IonSelect
              value={form.city}
              onIonChange={(e) => setForm({ ...form, city: e.detail.value || '' })}
              placeholder="Selecciona sucursal"
              className={errors.city ? 'ion-invalid' : ''}
            >
              {DEALERSHIPS.map((d) => (
                <IonSelectOption key={d.name} value={d.name}>
                  {d.name}
                </IonSelectOption>
              ))}
            </IonSelect>
            {errors.city && <span className="form-error">{errors.city}</span>}
          </div>

          {simulatorData && (
            <div className="form-summary-readonly">
              <p>Enganche: {simulatorData.downPayment.toLocaleString('es-MX')} MXN</p>
              <p>Mensualidad: {simulatorData.monthlyPayment.toLocaleString('es-MX')} MXN</p>
              <p>Total: {simulatorData.totalAmount.toLocaleString('es-MX')} MXN</p>
            </div>
          )}

          <IonButton
            expand="block"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="form-submit-btn"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default FinancingFormModal;
