import React, { useState } from 'react';
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
  IonSelect,
  IonSelectOption,
  IonLoading,
  IonToast,
  IonDatetime,
} from '@ionic/react';
import { save, personAddOutline, searchOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { valuationService } from '../../services/valuationService';
import './NewValuation.css';

interface Customer {
  uuid: string;
  name: string;
  last_name: string;
  phone_1: string;
  email?: string;
}

const NewValuation: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchMode, setSearchMode] = useState<'new' | 'search'>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    // Cliente (si es nuevo)
    customer_name: '',
    customer_last_name: '',
    customer_phone: '',
    customer_email: '',
    // Vehículo
    brand_name: '',
    model_name: '',
    year: new Date().getFullYear().toString(),
    mileage: '',
    // Cita
    scheduled_date: new Date().toISOString().slice(0, 16),
    dealership_name: '',
  });

  const handleSearchCustomers = async () => {
    if (!searchQuery.trim()) {
      setToastMessage('Ingresa un término de búsqueda');
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);
      const response = await valuationService.searchCustomers(searchQuery);
      
      if (response.status === 200 && response.data?.clientes?.data) {
        const customers = response.data.clientes.data.map((item: any) => ({
          uuid: item.customer_uuid || item.uuid,
          name: item.customer_name || item.name || '',
          last_name: item.customer_last_name || item.last_name || '',
          phone_1: item.customer_phone || item.phone_1 || '',
          email: item.customer_email || item.email_1 || '',
        }));
        setSearchResults(customers);
        
        if (customers.length === 0) {
          setToastMessage('No se encontraron clientes');
          setShowToast(true);
        }
      } else {
        setToastMessage('Error al buscar clientes');
        setShowToast(true);
      }
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || 'Error al buscar clientes');
      setShowToast(true);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      ...formData,
      customer_name: customer.name,
      customer_last_name: customer.last_name,
      customer_phone: customer.phone_1,
      customer_email: customer.email || '',
    });
    setSearchMode('new');
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.customer_name || !formData.customer_last_name || !formData.customer_phone) {
      setToastMessage('Completa los datos del cliente');
      setShowToast(true);
      return;
    }

    if (!formData.brand_name || !formData.model_name || !formData.year || !formData.mileage) {
      setToastMessage('Completa los datos del vehículo');
      setShowToast(true);
      return;
    }

    if (!formData.dealership_name) {
      setToastMessage('Ingresa el nombre del concesionario');
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);
      
      // Primero buscar o crear el cliente
      let customerUuid = selectedCustomer?.uuid;
      
      if (!customerUuid) {
        // Buscar cliente por teléfono primero
        if (formData.customer_phone) {
          try {
            const searchResponse = await valuationService.searchCustomers(formData.customer_phone, 1);
            if (searchResponse.status === 200 && searchResponse.data?.clientes?.data?.length > 0) {
              const foundCustomer = searchResponse.data.clientes.data[0];
              customerUuid = foundCustomer.customer_uuid || foundCustomer.uuid;
            }
          } catch (searchError) {
            // Continuar con la creación si no se encuentra
          }
        }

        // Si no se encontró, crear el cliente
        if (!customerUuid) {
          if (!formData.customer_email) {
            setToastMessage('El email es requerido para crear un nuevo cliente');
            setShowToast(true);
            setLoading(false);
            return;
          }

          const customerResponse = await valuationService.createCustomer({
            name: formData.customer_name,
            last_name: formData.customer_last_name,
            email: formData.customer_email,
            phone_1: formData.customer_phone,
            origin_agency: formData.dealership_name,
          });

          // Obtener el customer_uuid del cliente creado
          // El endpoint retorna el usuario con el perfil (customer)
          if (customerResponse.status === 201) {
            // El perfil del customer tiene el UUID
            const customerProfile = customerResponse.data?.profile;
            if (customerProfile?.uuid) {
              customerUuid = customerProfile.uuid;
            } else {
              // Si no está en profile, buscar en la respuesta completa
              console.log('Response data:', customerResponse.data);
              setToastMessage('Cliente creado pero no se pudo obtener el UUID. Intenta buscar el cliente.');
              setShowToast(true);
              setLoading(false);
              return;
            }
          } else {
            setToastMessage('Error al crear el cliente. Intenta buscar un cliente existente.');
            setShowToast(true);
            setLoading(false);
            return;
          }
        }
      }

      if (!customerUuid) {
        setToastMessage('No se pudo obtener el UUID del cliente');
        setShowToast(true);
        setLoading(false);
        return;
      }

      // Formatear la fecha correctamente (YYYY-MM-DD HH:MM:SS)
      const scheduledDate = new Date(formData.scheduled_date);
      const formattedDate = scheduledDate.toISOString().slice(0, 19).replace('T', ' ');

      // Crear la cita de valuación
      const response = await valuationService.createValuationAppointment({
        type: 'valuation',
        customer_uuid: customerUuid,
        brand_name: formData.brand_name.trim(),
        model_name: formData.model_name.trim(),
        year: parseInt(formData.year),
        mileage: parseInt(formData.mileage),
        scheduled_date: formattedDate,
        dealership_name: formData.dealership_name.trim(),
      });

      if (response.status === 201) {
        setToastMessage('Valuación creada exitosamente');
        setShowToast(true);
        
        // Redirigir a la lista de valuaciones después de un momento
        setTimeout(() => {
          history.push('/valuations');
        }, 1500);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error al crear la valuación';
      const validationErrors = error.response?.data?.errors;
      
      if (validationErrors) {
        const errorDetails = Object.values(validationErrors).flat().join(', ');
        setToastMessage(`Error de validación: ${errorDetails}`);
      } else {
        setToastMessage(errorMessage);
      }
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
          <IonTitle>Nueva Valuación</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonLoading isOpen={loading} message="Guardando..." />

        {/* Selector de modo: Nuevo cliente o Buscar cliente */}
        <div className="search-mode-selector">
          <IonButton
            fill={searchMode === 'new' ? 'solid' : 'outline'}
            onClick={() => setSearchMode('new')}
          >
            <IonIcon icon={personAddOutline} slot="start" />
            Nuevo Cliente
          </IonButton>
          <IonButton
            fill={searchMode === 'search' ? 'solid' : 'outline'}
            onClick={() => setSearchMode('search')}
          >
            <IonIcon icon={searchOutline} slot="start" />
            Buscar Cliente
          </IonButton>
        </div>

        {/* Búsqueda de clientes */}
        {searchMode === 'search' && (
          <div className="search-section">
            <IonItem>
              <IonLabel position="stacked">Buscar por nombre, teléfono o email</IonLabel>
              <IonInput
                value={searchQuery}
                onIonInput={(e) => setSearchQuery(e.detail.value || '')}
                placeholder="Buscar cliente..."
              />
              <IonButton slot="end" onClick={handleSearchCustomers}>
                <IonIcon icon={searchOutline} />
              </IonButton>
            </IonItem>

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((customer) => (
                  <IonItem
                    key={customer.uuid}
                    button
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <IonLabel>
                      <h2>{`${customer.name} ${customer.last_name}`}</h2>
                      <p>{customer.phone_1}</p>
                      {customer.email && <p>{customer.email}</p>}
                    </IonLabel>
                  </IonItem>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Formulario de Cliente */}
        <div className="form-section">
          <h2>Datos del Cliente</h2>
          
          <IonItem>
            <IonLabel position="stacked">Nombre *</IonLabel>
            <IonInput
              value={formData.customer_name}
              onIonInput={(e) =>
                setFormData({ ...formData, customer_name: e.detail.value || '' })
              }
              placeholder="Nombre del cliente"
              required
              disabled={!!selectedCustomer}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Apellidos *</IonLabel>
            <IonInput
              value={formData.customer_last_name}
              onIonInput={(e) =>
                setFormData({ ...formData, customer_last_name: e.detail.value || '' })
              }
              placeholder="Apellidos del cliente"
              required
              disabled={!!selectedCustomer}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Teléfono *</IonLabel>
            <IonInput
              type="tel"
              value={formData.customer_phone}
              onIonInput={(e) =>
                setFormData({ ...formData, customer_phone: e.detail.value || '' })
              }
              placeholder="Teléfono del cliente"
              required
              disabled={!!selectedCustomer}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Email{!selectedCustomer ? ' *' : ''}</IonLabel>
            <IonInput
              type="email"
              value={formData.customer_email}
              onIonInput={(e) =>
                setFormData({ ...formData, customer_email: e.detail.value || '' })
              }
              placeholder="Email del cliente"
              required={!selectedCustomer}
              disabled={!!selectedCustomer}
            />
          </IonItem>

          {selectedCustomer && (
            <IonButton
              fill="outline"
              expand="block"
              onClick={() => {
                setSelectedCustomer(null);
                setFormData({
                  ...formData,
                  customer_name: '',
                  customer_last_name: '',
                  customer_phone: '',
                  customer_email: '',
                });
              }}
              className="ion-margin-top"
            >
              Cambiar Cliente
            </IonButton>
          )}
        </div>

        {/* Formulario de Vehículo */}
        <div className="form-section">
          <h2>Datos del Vehículo</h2>

          <IonItem>
            <IonLabel position="stacked">Marca *</IonLabel>
            <IonInput
              value={formData.brand_name}
              onIonInput={(e) =>
                setFormData({ ...formData, brand_name: e.detail.value || '' })
              }
              placeholder="Ej: Toyota, Ford, Nissan..."
              required
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Modelo *</IonLabel>
            <IonInput
              value={formData.model_name}
              onIonInput={(e) =>
                setFormData({ ...formData, model_name: e.detail.value || '' })
              }
              placeholder="Ej: Corolla, Focus, Sentra..."
              required
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Año *</IonLabel>
            <IonInput
              type="number"
              value={formData.year}
              onIonInput={(e) =>
                setFormData({ ...formData, year: e.detail.value || '' })
              }
              placeholder="Año del vehículo"
              required
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Kilometraje *</IonLabel>
            <IonInput
              type="number"
              value={formData.mileage}
              onIonInput={(e) =>
                setFormData({ ...formData, mileage: e.detail.value || '' })
              }
              placeholder="Kilometraje del vehículo"
              required
            />
          </IonItem>
        </div>

        {/* Formulario de Cita */}
        <div className="form-section">
          <h2>Datos de la Cita</h2>

          <IonItem>
            <IonLabel position="stacked">Fecha y Hora *</IonLabel>
            <IonDatetime
              presentation="date-time"
              value={formData.scheduled_date}
              onIonChange={(e) =>
                setFormData({ ...formData, scheduled_date: e.detail.value as string })
              }
              min={new Date().toISOString()}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Concesionario *</IonLabel>
            <IonInput
              value={formData.dealership_name}
              onIonInput={(e) =>
                setFormData({ ...formData, dealership_name: e.detail.value || '' })
              }
              placeholder="Nombre del concesionario"
              required
            />
          </IonItem>
        </div>

        {/* Botón de guardar */}
        <IonButton
          expand="block"
          onClick={handleSubmit}
          className="ion-margin-top"
          disabled={loading}
        >
          <IonIcon icon={save} slot="start" />
          Crear Valuación
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

