import React, { useState, useEffect } from 'react';
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
  IonRange,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { close, calculatorOutline } from 'ionicons/icons';
import './SimulatorModal.css';

export interface SimulatorData {
  vehiclePrice: number;
  downPaymentPercentage: number;
  termMonths: number;
  interestRate: number;
  downPayment: number;
  financedAmount: number;
  monthlyPayment: number;
  totalAmount: number;
}

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrice?: number;
  onRequestFinancing?: (data: SimulatorData) => void;
}

const PLAZOS = [12, 24, 36, 48, 60];

const SimulatorModal: React.FC<SimulatorModalProps> = ({
  isOpen,
  onClose,
  initialPrice = 500000,
  onRequestFinancing,
}) => {
  const [vehiclePrice, setVehiclePrice] = useState(initialPrice);
  const [downPaymentPercentage, setDownPaymentPercentage] = useState(20);
  const [termMonths, setTermMonths] = useState(48);
  const [interestRate] = useState(15);

  useEffect(() => {
    if (isOpen && initialPrice) {
      setVehiclePrice(initialPrice);
    }
  }, [isOpen, initialPrice]);

  const downPayment = (vehiclePrice * downPaymentPercentage) / 100;
  const financedAmount = vehiclePrice - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const monthlyPayment =
    monthlyRate === 0
      ? financedAmount / termMonths
      : (financedAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);
  const totalAmount = downPayment + monthlyPayment * termMonths;

  const formatMxn = (n: number) =>
    `MX$ ${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const handleRequestFinancing = () => {
    onRequestFinancing?.({
      vehiclePrice,
      downPaymentPercentage,
      termMonths,
      interestRate,
      downPayment,
      financedAmount,
      monthlyPayment,
      totalAmount,
    });
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="simulator-modal">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>
            <IonIcon icon={calculatorOutline} className="modal-title-icon" />
            Simulador de crédito
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="simulator-form">
          <div className="simulator-field">
            <IonLabel>Precio del vehículo (MXN)</IonLabel>
            <IonInput
              type="number"
              value={vehiclePrice}
              onIonInput={(e) => setVehiclePrice(Number(e.detail.value) || 0)}
              placeholder="Ej: 500000"
              min={0}
            />
          </div>

          <div className="simulator-field">
            <IonLabel>Enganche: {downPaymentPercentage}%</IonLabel>
            <IonRange
              min={10}
              max={50}
              step={5}
              value={downPaymentPercentage}
              onIonChange={(e) => setDownPaymentPercentage(e.detail.value as number)}
            />
          </div>

          <div className="simulator-field">
            <IonLabel>Plazo (meses)</IonLabel>
            <IonSelect
              value={termMonths}
              onIonChange={(e) => setTermMonths(Number(e.detail.value))}
            >
              {PLAZOS.map((m) => (
                <IonSelectOption key={m} value={m}>
                  {m} meses
                </IonSelectOption>
              ))}
            </IonSelect>
          </div>

          <div className="simulator-field">
            <IonLabel>Tasa de interés</IonLabel>
            <IonInput type="number" value={interestRate} readonly />
          </div>

          <div className="simulator-summary">
            <h3>Resumen de tu financiamiento</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-amount">{formatMxn(downPayment)}</span>
                <span className="summary-label">Enganche</span>
              </div>
              <div className="summary-item">
                <span className="summary-amount">{formatMxn(monthlyPayment)}</span>
                <span className="summary-label">Mensualidad</span>
              </div>
              <div className="summary-item">
                <span className="summary-amount">{formatMxn(totalAmount)}</span>
                <span className="summary-label">Total a pagar</span>
              </div>
            </div>
          </div>

          <p className="simulator-disclaimer">
            Los montos son una aproximación. La oferta final puede variar según tu historial crediticio.
          </p>

          {onRequestFinancing && (
            <IonButton expand="block" onClick={handleRequestFinancing} className="simulator-cta">
              Solicitar financiamiento
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default SimulatorModal;
