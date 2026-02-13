import React, { useEffect, useMemo, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonItem,
  IonLabel,
  IonInput,
  IonList,
  IonSelect,
  IonSelectOption,
  IonLoading,
  IonToast,
  IonDatetime,
} from '@ionic/react';
import { save } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { valuationService } from '../../services/valuationService';
import { connectivityService } from '../../services/connectivityService';
import { offlineQueue, generateQueueId } from '../../services/offlineQueue';
import './NewValuation.css';

const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

const NewValuation: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [brands, setBrands] = useState<{ name: string }[]>([]);
  const [models, setModels] = useState<{ name: string }[]>([]);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);

  const years = useMemo(() => {
    const start = new Date().getFullYear() + 1;
    return Array.from({ length: 23 }, (_, i) => start - i);
  }, []);

  const profileLocation = useMemo(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('profile') || 'null');
      return profile?.location || 'chevrolet puebla';
    } catch {
      return 'chevrolet puebla';
    }
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    email: '',
    phone_1: '',
    brand_name: '',
    model_name: '',
    year: '',
    mileage: '',
    scheduled_date: '',
    hour: '',
  });

  const filteredBrands = useMemo(() => {
    const query = formData.brand_name.trim().toLowerCase();
    if (!query) return brands;
    return brands.filter((brand) => brand.name.toLowerCase().includes(query));
  }, [brands, formData.brand_name]);

  const filteredModels = useMemo(() => {
    const query = formData.model_name.trim().toLowerCase();
    const uniqueModels = Array.from(
      new Map(models.map((model) => [model.name.toLowerCase(), model])).values()
    );
    if (!query) return uniqueModels;
    return uniqueModels.filter((model) =>
      model.name.toLowerCase().includes(query)
    );
  }, [models, formData.model_name]);

  const validateForm = () => {
    if (!formData.name.trim() || !NAME_REGEX.test(formData.name.trim())) {
      return 'Complete su nombre(s).';
    }
    if (!formData.last_name.trim() || !NAME_REGEX.test(formData.last_name.trim())) {
      return 'Complete sus apellidos.';
    }
    if (!EMAIL_REGEX.test(formData.email.trim())) {
      return 'Escriba un correo electrónico válido.';
    }
    if (formData.phone_1.trim().length !== 10) {
      return 'Su número debe ser de 10 dígitos.';
    }
    if (!formData.brand_name.trim()) {
      return 'Escribe la marca del vehículo.';
    }
    if (!formData.model_name.trim()) {
      return 'Escribe el modelo del vehículo.';
    }
    if (!formData.year) {
      return 'Seleccione un año.';
    }
    if (!formData.mileage || Number(formData.mileage) <= 0) {
      return 'Teclee el kilometraje de su vehículo.';
    }
    if (!formData.scheduled_date) {
      return 'Asigne la fecha de su cita.';
    }
    if (!formData.hour) {
      return 'Asigne la hora de su cita.';
    }
    return '';
  };

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const response = await valuationService.getVehicleBrands();
        setBrands(response.data?.vehicle_brands ?? []);
      } catch {
        setBrands([]);
      }
    };
    loadBrands();
  }, []);

  useEffect(() => {
    const brandValue = formData.brand_name.trim();
    if (!brandValue) {
      setModels([]);
      return;
    }

    const match = brands.find(
      (brand) => brand.name.toLowerCase() === brandValue.toLowerCase()
    );
    if (!match) {
      setModels([]);
      return;
    }

    const loadModels = async () => {
      try {
        const response = await valuationService.getModelsByBrand(match.name);
        setModels(response.data?.line_models ?? []);
      } catch {
        setModels([]);
      }
    };
    loadModels();
  }, [formData.brand_name, brands]);

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setToastMessage(validationError);
      setShowToast(true);
      return;
    }

    if (!connectivityService.isOnline()) {
      try {
        setLoading(true);
        const formattedDate = `${formData.scheduled_date} ${formData.hour}`;
        await offlineQueue.add({
          id: generateQueueId(),
          type: 'create_valuation_with_customer',
          payload: {
            customer: {
              name: formData.name.trim(),
              last_name: formData.last_name.trim(),
              email: formData.email.trim(),
              phone_1: formData.phone_1.trim(),
              origin_agency: profileLocation,
            },
            appointment: {
              type: 'valuation',
              brand_name: formData.brand_name.trim(),
              model_name: formData.model_name.trim(),
              year: parseInt(formData.year, 10),
              mileage: parseInt(formData.mileage, 10),
              scheduled_date: formattedDate,
              dealership_name: profileLocation,
            },
          },
        });
        setToastMessage('Cita guardada. Se enviará cuando haya conexión.');
        setShowToast(true);
        setTimeout(() => history.push('/valuations'), 1200);
      } catch {
        setToastMessage('Error al guardar localmente.');
        setShowToast(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);

      const customerResponse = await valuationService.createCustomer({
        name: formData.name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone_1: formData.phone_1.trim(),
        origin_agency: profileLocation,
      });

      if (customerResponse.status !== 201 || !customerResponse.data?.profile?.uuid) {
        setToastMessage('Error al crear el cliente.');
        setShowToast(true);
        setLoading(false);
        return;
      }

      const customerUuid = customerResponse.data.profile.uuid;
      const formattedDate = `${formData.scheduled_date} ${formData.hour}`;

      const appointmentResponse = await valuationService.createValuationAppointment({
        type: 'valuation',
        customer_uuid: customerUuid,
        brand_name: formData.brand_name.trim(),
        model_name: formData.model_name.trim(),
        year: parseInt(formData.year, 10),
        mileage: parseInt(formData.mileage, 10),
        scheduled_date: formattedDate,
        dealership_name: profileLocation,
      });

      if (appointmentResponse.status === 201) {
        setToastMessage('Cita creada exitosamente.');
        setShowToast(true);
        setTimeout(() => {
          history.push('/valuations', { refresh: true });
        }, 1200);
      } else {
        setToastMessage('Error al crear la cita de valuación.');
        setShowToast(true);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al crear la cita de valuación.';
      setToastMessage(errorMessage);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/valuations" />
          </IonButtons>
          <IonTitle>Agregar Cita de Valuación</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonLoading isOpen={loading} message="Enviando..." />

        <div className="form-section">
          <h2>Información del Cliente</h2>
          <IonItem>
            <IonLabel position="stacked">Nombre(s)</IonLabel>
            <IonInput
              value={formData.name}
              onIonInput={(e) => setFormData({ ...formData, name: e.detail.value || '' })}
              placeholder="Ingresa tu nombre"
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Apellidos</IonLabel>
            <IonInput
              value={formData.last_name}
              onIonInput={(e) =>
                setFormData({ ...formData, last_name: e.detail.value || '' })
              }
              placeholder="Ingresa tus apellidos"
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Correo Electrónico</IonLabel>
            <IonInput
              type="email"
              value={formData.email}
              onIonInput={(e) =>
                setFormData({ ...formData, email: e.detail.value || '' })
              }
              placeholder="Ingresa tu email"
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Número de teléfono</IonLabel>
            <IonInput
              type="tel"
              value={formData.phone_1}
              onIonInput={(e) =>
                setFormData({ ...formData, phone_1: e.detail.value || '' })
              }
              placeholder="Ingresa tu número telefónico"
              maxlength={10}
            />
          </IonItem>
        </div>

        <div className="form-section">
          <h2>Información del Vehículo</h2>
          <IonItem>
            <IonLabel position="stacked">Marca</IonLabel>
            <IonInput
              value={formData.brand_name}
              onIonFocus={() => setShowBrandSuggestions(true)}
              onIonInput={(e) => {
                const value = e.detail.value || '';
                setFormData({ ...formData, brand_name: value, model_name: '' });
                setShowBrandSuggestions(true);
              }}
              onIonBlur={() => setTimeout(() => setShowBrandSuggestions(false), 150)}
              placeholder="Escribe la marca"
            />
          </IonItem>
          {showBrandSuggestions && filteredBrands.length > 0 && (
            <IonList className="suggestions-list">
              {filteredBrands.map((brand) => (
                <IonItem
                  key={brand.name}
                  button
                  onMouseDown={() => {
                    setFormData({ ...formData, brand_name: brand.name, model_name: '' });
                    setShowBrandSuggestions(false);
                  }}
                >
                  <IonLabel>{brand.name}</IonLabel>
                </IonItem>
              ))}
            </IonList>
          )}
          <IonItem>
            <IonLabel position="stacked">Modelo</IonLabel>
            <IonInput
              value={formData.model_name}
              onIonFocus={() => setShowModelSuggestions(true)}
              onIonInput={(e) => {
                const value = e.detail.value || '';
                setFormData({ ...formData, model_name: value });
                setShowModelSuggestions(true);
              }}
              onIonBlur={() => setTimeout(() => setShowModelSuggestions(false), 150)}
              placeholder="Escribe el modelo"
            />
          </IonItem>
          {showModelSuggestions && filteredModels.length > 0 && (
            <IonList className="suggestions-list">
              {filteredModels.map((model) => (
                <IonItem
                  key={model.name}
                  button
                  onMouseDown={() => {
                    setFormData({ ...formData, model_name: model.name });
                    setShowModelSuggestions(false);
                  }}
                >
                  <IonLabel>{model.name}</IonLabel>
                </IonItem>
              ))}
            </IonList>
          )}
          <IonItem>
            <IonLabel position="stacked">Año</IonLabel>
            <IonSelect
              value={formData.year}
              placeholder="Seleccione el año del vehículo"
              onIonChange={(e) => setFormData({ ...formData, year: e.detail.value })}
              interface="popover"
            >
              {years.map((year) => (
                <IonSelectOption key={year} value={String(year)}>
                  {year}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Kilometraje</IonLabel>
            <IonInput
              type="number"
              value={formData.mileage}
              onIonInput={(e) =>
                setFormData({ ...formData, mileage: e.detail.value || '' })
              }
              placeholder="000000"
              maxlength={10}
            />
          </IonItem>
        </div>

        <div className="form-section">
          <h2>Fecha y Hora de Cita</h2>
          <IonItem>
            <IonLabel position="stacked">Fecha de cita</IonLabel>
            <IonDatetime
              presentation="date"
              value={formData.scheduled_date}
              min={new Date().toISOString()}
              onIonChange={(e) =>
                setFormData({ ...formData, scheduled_date: String(e.detail.value || '') })
              }
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Hora de cita</IonLabel>
            <IonInput
              type="time"
              value={formData.hour}
              onIonInput={(e) =>
                setFormData({ ...formData, hour: e.detail.value || '' })
              }
            />
          </IonItem>
        </div>

        <IonButton expand="block" onClick={handleSubmit} className="ion-margin-top">
          <IonIcon icon={save} slot="start" />
          Enviar
        </IonButton>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default NewValuation;

