import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonLoading,
  IonToast,
  IonBackButton,
  IonButtons,
} from '@ionic/react';
import { checkmarkCircle, informationCircle, cameraOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { valuationService } from '../../services/valuationService';
import { Checkpoint, CHECKLIST_SECTIONS, ChecklistSection } from '../../models';
import './Checklist.css';

type Technician = {
  uuid: string;
  user_profile: {
    name: string;
    last_name: string;
  };
};

const COUNTRIES = [
  { value: 'china', label: 'China' },
  { value: 'estados_unidos', label: 'Estados Unidos' },
  { value: 'japon', label: 'Japón' },
  { value: 'india', label: 'India' },
  { value: 'alemania', label: 'Alemania' },
  { value: 'mexico', label: 'México' },
  { value: 'corea_del_sur', label: 'Corea del Sur' },
  { value: 'brasil', label: 'Brasil' },
  { value: 'espana', label: 'España' },
  { value: 'francia', label: 'Francia' },
  { value: 'canada', label: 'Canadá' },
  { value: 'rusia', label: 'Rusia' },
  { value: 'tailandia', label: 'Tailandia' },
  { value: 'reino_unido', label: 'Reino Unido' },
  { value: 'indonesia', label: 'Indonesia' },
  { value: 'republica_checa', label: 'República Checa' },
  { value: 'turquia', label: 'Turquía' },
  { value: 'eslovaquia', label: 'Eslovaquia' },
  { value: 'iran', label: 'Irán' },
  { value: 'italia', label: 'Italia' },
  { value: 'polonia', label: 'Polonia' },
  { value: 'malasia', label: 'Malasia' },
  { value: 'belgica', label: 'Bélgica' },
  { value: 'sudafrica', label: 'Sudáfrica' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'taiwan', label: 'Taiwán' },
  { value: 'rumania', label: 'Rumania' },
  { value: 'hungria', label: 'Hungría' },
  { value: 'australia', label: 'Australia' },
  { value: 'uzbekistan', label: 'Uzbekistán' },
  { value: 'portugal', label: 'Portugal' },
  { value: 'suecia', label: 'Suecia' },
  { value: 'austria', label: 'Austria' },
  { value: 'eslovenia', label: 'Eslovenia' },
  { value: 'colombia', label: 'Colombia' },
  { value: 'ucrania', label: 'Ucrania' },
  { value: 'paises_bajos', label: 'Países Bajos' },
  { value: 'pakistan', label: 'Pakistán' },
  { value: 'egipto', label: 'Egipto' },
  { value: 'filipinas', label: 'Filipinas' },
  { value: 'marruecos', label: 'Marruecos' },
  { value: 'venezuela', label: 'Venezuela' },
  { value: 'vietnam', label: 'Vietnam' },
  { value: 'ecuador', label: 'Ecuador' },
  { value: 'bielorrusia', label: 'Bielorrusia' },
  { value: 'serbia', label: 'Serbia' },
  { value: 'finlandia', label: 'Finlandia' },
  { value: 'nigeria', label: 'Nigeria' },
  { value: 'chile', label: 'Chile' },
];

const TRANSMISSIONS = [
  { value: 'automatic', label: 'Automática' },
  { value: 'manual', label: 'Manual' },
  { value: 'semiautomatic', label: 'Semi Automática' },
  { value: 'cvt', label: 'CVT' },
  { value: 'dual-clutch', label: 'DSG' },
  { value: 'others', label: 'Otros' },
];

const ENGINE_INTAKES = [
  { value: 'normal', label: 'Normal' },
  { value: 'turbo', label: 'Turbo' },
];

const START_STOP_OPTIONS = [
  { value: 'yes', label: 'Sí' },
  { value: 'no', label: 'No' },
];

const CYLINDERS = ['3', '4', '5', '6', '8', '12'];

const Checklist: React.FC = () => {
  const { valuationUuid } = useParams<{ valuationUuid: string }>();
  const [selectedSection, setSelectedSection] = useState<ChecklistSection>(
    CHECKLIST_SECTIONS[0]
  );
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    last_name: '',
    phone_1: '',
    dealership_name: '',
    country_of_origin: '',
    transmission: '',
    intake_engine: '',
    auto_start_stop: '',
    scheduled_date: '',
    vin: '',
    brand: '',
    model: '',
    version: '',
    year: '',
    mileage: '',
    exterior_color: '',
    plates: '',
    cylinders: '',
    engine_type: '',
    appraiserTechnician: '',
    body: '',
  });
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerLocked, setCustomerLocked] = useState(false);
  const history = useHistory();

  useEffect(() => {
    if (!valuationUuid) return;
    if (selectedSection !== 'Información Cliente') {
      loadChecklist();
      return;
    }
    setLoading(true);
    loadCustomerInformation().finally(() => setLoading(false));
  }, [valuationUuid, selectedSection]);

  useEffect(() => {
    if (!valuationUuid) return;
    loadCustomerInformation();
    loadTechnicians();
  }, [valuationUuid]);

  const loadChecklist = async () => {
    if (!valuationUuid) return;

    try {
      setLoading(true);
      const response = await valuationService.getChecklist(valuationUuid, selectedSection);
      if (response.status === 200) {
        setCheckpoints(response.data);
        setInputValues((prev) => {
          const next = { ...prev };
          response.data.forEach((cp) => {
            if (next[cp.uuid] === undefined) {
              next[cp.uuid] = cp.selected_value || '';
            }
          });
          return next;
        });
      }
    } catch (error: any) {
      setToastMessage('Error al cargar checklist');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const normalizeDate = (value?: string) => {
    if (!value) return '';
    const trimmed = value.includes('T') ? value.split('T')[0] : value.split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    if (value.length >= 10) {
      const maybeDate = value.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(maybeDate)) {
        return maybeDate;
      }
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }
    return parsed.toISOString().slice(0, 10);
  };

  const loadCustomerInformation = async () => {
    if (!valuationUuid) return;
    try {
      const response = await valuationService.getValuationDetail(valuationUuid);
      if (response.status !== 200 || !response.data) return;
      const detail = response.data;
      const appointment = detail.appointment;
      const vehicle = detail.vehicle;
      const appointmentVehicle = appointment?.vehicle;
      const spec = detail.vehicle?.specification as
        | {
            country_of_origin?: string;
            countryOrigin?: string;
            intake_engine?: string;
            intakeEngine?: string;
            auto_start_stop?: string;
            autoStartStop?: string;
            plates?: string;
            exterior_color?: string;
            engine_type?: string;
          }
        | undefined;
      const technicianUuid = Array.isArray(detail.technician)
        ? detail.technician[0]?.uuid || ''
        : detail.technician?.uuid ||
          (detail as { technician_uuid?: string }).technician_uuid ||
          '';
      const yearValue = vehicle?.year ?? appointmentVehicle?.year;
      const mileageValue = vehicle?.mileage ?? appointmentVehicle?.mileage;
      const versionName =
        typeof vehicle?.version === 'string'
          ? vehicle?.version
          : vehicle?.version?.name;
      const bodyName =
        typeof vehicle?.body === 'string' ? vehicle?.body : vehicle?.body?.name;
      const lockedByStatus = detail.status && detail.status !== 'to_appraise';
      setCustomerLocked(Boolean(lockedByStatus));
      const scheduledDate = normalizeDate(
        appointment?.scheduled_date ||
          appointment?.preferred_date ||
          detail.created_at
      );

      setCustomerInfo((prev) => ({
        ...prev,
        name: appointment?.customer?.name || prev.name,
        last_name: appointment?.customer?.last_name || prev.last_name,
        phone_1: appointment?.customer?.phone_1 || prev.phone_1,
        dealership_name: detail.dealership?.name || prev.dealership_name,
        country_of_origin:
          spec?.country_of_origin?.toLowerCase() ||
          spec?.countryOrigin?.toLowerCase() ||
          vehicle?.country_of_origin ||
          prev.country_of_origin,
        transmission: vehicle?.transmission || prev.transmission,
        intake_engine:
          spec?.intake_engine?.toLowerCase() ||
          spec?.intakeEngine?.toLowerCase() ||
          vehicle?.intake_engine ||
          prev.intake_engine,
        auto_start_stop:
          spec?.auto_start_stop ||
          spec?.autoStartStop ||
          vehicle?.auto_start_stop ||
          prev.auto_start_stop,
        scheduled_date: scheduledDate || prev.scheduled_date,
        vin: vehicle?.vin || prev.vin,
        brand: vehicle?.brand?.name || appointmentVehicle?.brand_name || prev.brand,
        model: vehicle?.model?.name || appointmentVehicle?.model_name || prev.model,
        version: versionName || prev.version,
        year: yearValue ? String(yearValue) : prev.year,
        mileage: mileageValue ? String(mileageValue) : prev.mileage,
        exterior_color:
          vehicle?.exterior_color || spec?.exterior_color || prev.exterior_color,
        plates: vehicle?.plates || spec?.plates || prev.plates,
        cylinders: vehicle?.cylinders ? String(vehicle.cylinders) : prev.cylinders,
        engine_type: vehicle?.engine_type || spec?.engine_type || prev.engine_type,
        body: bodyName || prev.body,
        appraiserTechnician: technicianUuid || prev.appraiserTechnician,
      }));
    } catch {
      // noop
    }
  };

  const loadTechnicians = async () => {
    try {
      const response = await valuationService.getTechnicians();
      setTechnicians(response.data?.users ?? []);
    } catch {
      setTechnicians([]);
    }
  };

  const validateCustomerInfo = () => {
    if (!customerInfo.name.trim()) return 'Complete su(s) nombre(s).';
    if (!customerInfo.last_name.trim()) return 'Complete sus apellidos.';
    if (customerInfo.phone_1.trim().length !== 10) return 'Su número debe ser de 10 dígitos.';
    if (!customerInfo.dealership_name.trim()) return 'Complete el nombre del distribuidor.';
    if (!customerInfo.country_of_origin) return 'Escriba el país de orígen del vehículo.';
    if (!customerInfo.transmission) return 'Seleccione la transmisión.';
    if (!customerInfo.intake_engine) return 'Seleccione el tipo de aspiración.';
    if (!customerInfo.auto_start_stop) return '¿Tecnología Start-Stop?';
    if (!customerInfo.scheduled_date) return 'Especifique la fecha de la valuación.';
    if (customerInfo.vin.trim().length !== 17) return 'Escriba el vin de su vehículo.';
    if (!customerInfo.brand.trim()) return 'Seleccione una marca.';
    if (!customerInfo.model.trim()) return 'Seleccione un modelo.';
    if (!customerInfo.version.trim()) return 'Escriba la versión de su vehículo.';
    if (!customerInfo.year) return 'Seleccione un año.';
    if (!customerInfo.body.trim()) return 'Proporcione el tipo de carrocería del vehículo.';
    if (!customerInfo.mileage.trim()) return 'Escriba el kilometraje de su vehículo.';
    if (!customerInfo.exterior_color.trim()) return 'Proporcione el color del vehículo.';
    if (!customerInfo.cylinders) return 'Proporcione el número de cilindros del vehículo.';
    if (!customerInfo.engine_type.trim()) return 'Complete el tipo de motor.';
    if (!customerInfo.appraiserTechnician) return 'Seleccione un tecnico.';
    return '';
  };

  const handleSaveCustomerInfo = async () => {
    if (!valuationUuid) return;
    const error = validateCustomerInfo();
    if (error) {
      setToastMessage(error);
      setShowToast(true);
      return;
    }

    try {
      setSavingCustomer(true);
      await valuationService.updateCustomerInformation({
        ...customerInfo,
        brand: customerInfo.brand.trim(),
        dealership_name: customerInfo.dealership_name.trim(),
        model: customerInfo.model.trim(),
        technician_uuid: customerInfo.appraiserTechnician,
        year: Number(customerInfo.year),
        mileage: Number(customerInfo.mileage),
        page_status: 'valuing',
        location: customerInfo.dealership_name.trim(),
        type: 'car',
        valuation_uuid: valuationUuid,
      });
      setCustomerLocked(true);
      setSelectedSection('Mecánica y Eléctrica');
      try {
        await valuationService.updateValuation({
          valuation_uuid: valuationUuid,
          status: 'on_progress',
        });
      } catch {
        // Status update failure shouldn't block user flow.
      }
      setToastMessage('Alta/Actualización de registro exitoso.');
      setShowToast(true);
    } catch {
      setToastMessage('Error al guardar información del cliente.');
      setShowToast(true);
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleCheckpointChange = async (
    checkpointUuid: string,
    selectedValue: string
  ) => {
    if (!valuationUuid) return;

    try {
      setSaving(true);
      await valuationService.updateCheckpoint(valuationUuid, checkpointUuid, selectedValue);
      
      // Actualizar estado local
      setCheckpoints((prev) =>
        prev.map((cp) =>
          cp.uuid === checkpointUuid ? { ...cp, selected_value: selectedValue } : cp
        )
      );
      
      setToastMessage('Guardado correctamente');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage('Error al guardar');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const renderCheckpointInput = (checkpoint: Checkpoint) => {
    switch (checkpoint.value_type) {
      case 'textarea':
      case 'longtext':
        return (
          <IonTextarea
            value={inputValues[checkpoint.uuid] ?? checkpoint.selected_value ?? ''}
            placeholder="Ingresar texto"
            autoGrow
            onIonInput={(e) =>
              setInputValues((prev) => ({
                ...prev,
                [checkpoint.uuid]: e.detail.value || '',
              }))
            }
            onIonBlur={() =>
              handleCheckpointChange(
                checkpoint.uuid,
                inputValues[checkpoint.uuid] ?? ''
              )
            }
          />
        );

      case 'select':
        return (
          <IonSelect
            value={checkpoint.selected_value || ''}
            placeholder="Seleccionar"
            onIonChange={(e) =>
              handleCheckpointChange(checkpoint.uuid, e.detail.value)
            }
            interface="popover"
          >
            {checkpoint.values.map((value) => (
              <IonSelectOption key={value} value={value}>
                {value}
              </IonSelectOption>
            ))}
          </IonSelect>
        );

      case 'text':
        return (
          <IonInput
            value={inputValues[checkpoint.uuid] ?? checkpoint.selected_value ?? ''}
            placeholder="Ingresar texto"
            onIonInput={(e) =>
              setInputValues((prev) => ({
                ...prev,
                [checkpoint.uuid]: e.detail.value || '',
              }))
            }
            onIonBlur={() =>
              handleCheckpointChange(
                checkpoint.uuid,
                inputValues[checkpoint.uuid] ?? ''
              )
            }
          />
        );

      case 'number':
        return (
          <IonInput
            type="number"
            value={inputValues[checkpoint.uuid] ?? checkpoint.selected_value ?? ''}
            placeholder="Ingresar número"
            onIonInput={(e) =>
              setInputValues((prev) => ({
                ...prev,
                [checkpoint.uuid]: e.detail.value || '',
              }))
            }
            onIonBlur={() =>
              handleCheckpointChange(
                checkpoint.uuid,
                inputValues[checkpoint.uuid] ?? ''
              )
            }
          />
        );

      case 'date':
        return (
          <IonInput
            type="date"
            value={inputValues[checkpoint.uuid] ?? checkpoint.selected_value ?? ''}
            onIonChange={(e) => {
              const value = e.detail.value || '';
              setInputValues((prev) => ({
                ...prev,
                [checkpoint.uuid]: value,
              }));
              handleCheckpointChange(checkpoint.uuid, value);
            }}
          />
        );

      case 'boolean':
        return (
          <IonButton
            fill={checkpoint.selected_value === 'yes' ? 'solid' : 'outline'}
            color={checkpoint.selected_value === 'yes' ? 'success' : 'medium'}
            onClick={() =>
              handleCheckpointChange(
                checkpoint.uuid,
                checkpoint.selected_value === 'yes' ? 'no' : 'yes'
              )
            }
          >
            {checkpoint.selected_value === 'yes' ? 'Sí' : 'No'}
          </IonButton>
        );

      default:
        return (
          <IonInput
            value={inputValues[checkpoint.uuid] ?? checkpoint.selected_value ?? ''}
            placeholder="Ingresar texto"
            onIonInput={(e) =>
              setInputValues((prev) => ({
                ...prev,
                [checkpoint.uuid]: e.detail.value || '',
              }))
            }
            onIonBlur={() =>
              handleCheckpointChange(
                checkpoint.uuid,
                inputValues[checkpoint.uuid] ?? ''
              )
            }
          />
        );
    }
  };

  const getProgress = () => {
    const completed = checkpoints.filter((cp) => cp.selected_value).length;
    return checkpoints.length > 0 ? (completed / checkpoints.length) * 100 : 0;
  };

  const handleOpenExternalPhotos = () => {
    if (!valuationUuid) return;
    history.push(`/valuations/${valuationUuid}/photos/exterior`);
  };

  const handleOpenInternalPhotos = () => {
    if (!valuationUuid) return;
    history.push(`/valuations/${valuationUuid}/photos/interior`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/valuations" />
          </IonButtons>
          <IonTitle>Checklist de Valuación</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="checklist-container">
          <div className="sticky-header">
            <IonSegment
              value={selectedSection}
              onIonChange={(e) => setSelectedSection(e.detail.value as ChecklistSection)}
              scrollable
            >
              {CHECKLIST_SECTIONS.map((section) => (
                <IonSegmentButton key={section} value={section}>
                  <IonLabel>{section}</IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>

            {selectedSection !== 'Información Cliente' && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${getProgress()}%` }}
                />
                <span className="progress-text">
                  {checkpoints.filter((cp) => cp.selected_value).length} / {checkpoints.length}
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <IonLoading isOpen={loading} message="Cargando checklist..." />
          ) : selectedSection === 'Información Cliente' ? (
            <>
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Información del cliente y Distribuidor</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Nombre del cliente</IonLabel>
                          <IonInput
                            value={customerInfo.name}
                            disabled
                            onIonInput={(e) =>
                              setCustomerInfo({ ...customerInfo, name: e.detail.value || '' })
                            }
                            placeholder="Nombre del cliente"
                          />
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Apellidos del cliente</IonLabel>
                          <IonInput
                            value={customerInfo.last_name}
                            disabled
                            onIonInput={(e) =>
                              setCustomerInfo({ ...customerInfo, last_name: e.detail.value || '' })
                            }
                            placeholder="Apellidos del cliente"
                          />
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Número de Teléfono</IonLabel>
                          <IonInput
                            type="tel"
                            value={customerInfo.phone_1}
                            maxlength={10}
                            disabled
                            onIonInput={(e) =>
                              setCustomerInfo({ ...customerInfo, phone_1: e.detail.value || '' })
                            }
                            placeholder="1234567890"
                          />
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Distribuidor</IonLabel>
                          <IonInput
                            value={customerInfo.dealership_name}
                            disabled
                            onIonInput={(e) =>
                              setCustomerInfo({ ...customerInfo, dealership_name: e.detail.value || '' })
                            }
                            placeholder="Nombre del distribuidor"
                          />
                        </IonItem>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>

              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Valuación e información del auto</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">País de origen</IonLabel>
                          <IonSelect
                            value={customerInfo.country_of_origin}
                            placeholder="Seleccione país de origen"
                            disabled={customerLocked}
                            onIonChange={(e) =>
                              setCustomerInfo({ ...customerInfo, country_of_origin: e.detail.value })
                            }
                          >
                            {COUNTRIES.map((country) => (
                              <IonSelectOption key={country.value} value={country.value}>
                                {country.label}
                              </IonSelectOption>
                            ))}
                          </IonSelect>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Transmisión</IonLabel>
                          <IonSelect
                            value={customerInfo.transmission}
                            placeholder="Seleccionar una transmisión"
                            disabled={customerLocked}
                            onIonChange={(e) =>
                              setCustomerInfo({ ...customerInfo, transmission: e.detail.value })
                            }
                          >
                            {TRANSMISSIONS.map((option) => (
                              <IonSelectOption key={option.value} value={option.value}>
                                {option.label}
                              </IonSelectOption>
                            ))}
                          </IonSelect>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Aspiración del Motor</IonLabel>
                          <IonSelect
                            value={customerInfo.intake_engine}
                            placeholder="Seleccionar tipo de aspiración"
                            disabled={customerLocked}
                            onIonChange={(e) =>
                              setCustomerInfo({ ...customerInfo, intake_engine: e.detail.value })
                            }
                          >
                            {ENGINE_INTAKES.map((option) => (
                              <IonSelectOption key={option.value} value={option.value}>
                                {option.label}
                              </IonSelectOption>
                            ))}
                          </IonSelect>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Start-stop</IonLabel>
                          <IonSelect
                            value={customerInfo.auto_start_stop}
                            placeholder="¿Tiene start-stop?"
                            disabled={customerLocked}
                            onIonChange={(e) =>
                              setCustomerInfo({ ...customerInfo, auto_start_stop: e.detail.value })
                            }
                          >
                            {START_STOP_OPTIONS.map((option) => (
                              <IonSelectOption key={option.value} value={option.value}>
                                {option.label}
                              </IonSelectOption>
                            ))}
                          </IonSelect>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Fecha de valuación</IonLabel>
                          <IonInput
                            type="date"
                            value={customerInfo.scheduled_date}
                            disabled
                            onIonInput={(e) =>
                              setCustomerInfo({ ...customerInfo, scheduled_date: e.detail.value || '' })
                            }
                          />
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">VIN</IonLabel>
                          <IonInput
                            value={customerInfo.vin}
                            maxlength={17}
                            disabled={customerLocked}
                            onIonInput={(e) =>
                              setCustomerInfo({
                                ...customerInfo,
                                vin: (e.detail.value || '').toUpperCase(),
                              })
                            }
                            placeholder="00000000000000000"
                          />
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Marca</IonLabel>
                          <IonInput
                            value={customerInfo.brand}
                            disabled
                            onIonInput={(e) =>
                              setCustomerInfo({ ...customerInfo, brand: e.detail.value || '' })
                            }
                            placeholder="Marca"
                          />
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Modelo</IonLabel>
                          <IonInput
                            value={customerInfo.model}
                            disabled
                            onIonInput={(e) =>
                              setCustomerInfo({ ...customerInfo, model: e.detail.value || '' })
                            }
                            placeholder="Modelo"
                          />
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Versión</IonLabel>
                          <IonInput
                            value={customerInfo.version}
                            disabled={customerLocked}
                            onIonInput={(e) =>
                              setCustomerInfo({ ...customerInfo, version: e.detail.value || '' })
                            }
                            placeholder="LTZ"
                          />
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Año</IonLabel>
                          <IonSelect
                            value={customerInfo.year}
                            placeholder="Seleccione el año del vehículo"
                            disabled
                            onIonChange={(e) =>
                              setCustomerInfo({ ...customerInfo, year: e.detail.value })
                            }
                          >
                            {Array.from({ length: 23 }, (_, i) => new Date().getFullYear() + 1 - i).map(
                              (year) => (
                                <IonSelectOption key={year} value={String(year)}>
                                  {year}
                                </IonSelectOption>
                              )
                            )}
                          </IonSelect>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Carrocería</IonLabel>
                          <IonInput
                            value={customerInfo.body}
                            disabled={customerLocked}
                            onIonInput={(e) =>
                              setCustomerInfo({ ...customerInfo, body: e.detail.value || '' })
                            }
                            placeholder="Carrocería"
                          />
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Kilometraje</IonLabel>
                          <IonInput
                            type="number"
                            value={customerInfo.mileage}
                            disabled
                            onIonInput={(e) =>
                              setCustomerInfo({ ...customerInfo, mileage: e.detail.value || '' })
                            }
                            placeholder="0000000"
                          />
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Color</IonLabel>
                          <IonInput
                            value={customerInfo.exterior_color}
                            disabled={customerLocked}
                            onIonInput={(e) =>
                              setCustomerInfo({ ...customerInfo, exterior_color: e.detail.value || '' })
                            }
                            placeholder="Color"
                          />
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Placa</IonLabel>
                          <IonInput
                            value={customerInfo.plates}
                            maxlength={7}
                            disabled={customerLocked}
                            onIonInput={(e) =>
                              setCustomerInfo({
                                ...customerInfo,
                                plates: (e.detail.value || '').toUpperCase(),
                              })
                            }
                            placeholder="0000000"
                          />
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Cilindros</IonLabel>
                          <IonSelect
                            value={customerInfo.cylinders}
                            placeholder="Selecciona el número de cilindros"
                            disabled={customerLocked}
                            onIonChange={(e) =>
                              setCustomerInfo({ ...customerInfo, cylinders: e.detail.value })
                            }
                          >
                            {CYLINDERS.map((cylinder) => (
                              <IonSelectOption key={cylinder} value={cylinder}>
                                {cylinder}
                              </IonSelectOption>
                            ))}
                          </IonSelect>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Tipo de motor</IonLabel>
                          <IonInput
                            value={customerInfo.engine_type}
                            disabled={customerLocked}
                            onIonInput={(e) =>
                              setCustomerInfo({ ...customerInfo, engine_type: e.detail.value || '' })
                            }
                            placeholder="1.0 o 2.5"
                          />
                        </IonItem>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonItem>
                          <IonLabel position="stacked">Nombre del Técnico</IonLabel>
                          <IonSelect
                            value={customerInfo.appraiserTechnician}
                            placeholder="Seleccione el tecnico"
                            disabled={customerLocked}
                            onIonChange={(e) =>
                              setCustomerInfo({
                                ...customerInfo,
                                appraiserTechnician: e.detail.value,
                              })
                            }
                          >
                            {technicians.map((technician) => (
                              <IonSelectOption key={technician.uuid} value={technician.uuid}>
                                {technician.user_profile.name} {technician.user_profile.last_name}
                              </IonSelectOption>
                            ))}
                          </IonSelect>
                        </IonItem>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                  <IonButton
                    expand="block"
                    onClick={() => {
                      if (customerLocked) {
                        setSelectedSection('Mecánica y Eléctrica');
                        return;
                      }
                      handleSaveCustomerInfo();
                    }}
                    disabled={savingCustomer}
                    className="ion-margin-top"
                  >
                    {savingCustomer ? 'Guardando...' : customerLocked ? 'Siguiente' : 'Guardar'}
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </>
          ) : (
            <>
              {checkpoints.length === 0 ? (
                <div className="empty-state">
                  <IonIcon icon={informationCircle} size="large" />
                  <p>No hay items para esta sección</p>
                </div>
              ) : (
                <IonList>
                  {checkpoints.map((checkpoint) => (
                    <IonCard key={checkpoint.uuid}>
                      <IonCardHeader>
                        <div className="checkpoint-title-container">
                          <IonCardTitle>{checkpoint.name}</IonCardTitle>
                          {checkpoint.description && (
                            <IonIcon
                              icon={informationCircle}
                              className={`info-icon ${expandedDescriptions.has(checkpoint.uuid) ? 'expanded' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedDescriptions((prev) => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(checkpoint.uuid)) {
                                    newSet.delete(checkpoint.uuid);
                                  } else {
                                    newSet.add(checkpoint.uuid);
                                  }
                                  return newSet;
                                });
                              }}
                            />
                          )}
                        </div>
                        {checkpoint.description && expandedDescriptions.has(checkpoint.uuid) && (
                          <p className="checkpoint-description-caption">{checkpoint.description}</p>
                        )}
                      </IonCardHeader>
                      <IonCardContent>
                        <IonItem>
                          {renderCheckpointInput(checkpoint)}
                          {checkpoint.selected_value && (
                            <IonIcon
                              icon={checkmarkCircle}
                              color="success"
                              slot="end"
                            />
                          )}
                        </IonItem>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </IonList>
              )}

              {/* Botones de fotos por sección */}
              {selectedSection === 'Revisión Exterior' && (
                <div className="photo-section-button">
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={handleOpenExternalPhotos}
                    className="ion-margin-top"
                  >
                    <IonIcon icon={cameraOutline} slot="start" />
                    Foto Exterior
                  </IonButton>
                </div>
              )}

              {selectedSection === 'Revisión Interior' && (
                <div className="photo-section-button">
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={handleOpenInternalPhotos}
                    className="ion-margin-top"
                  >
                    <IonIcon icon={cameraOutline} slot="start" />
                    Foto Interior
                  </IonButton>
                </div>
              )}
            </>
          )}
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Checklist;

