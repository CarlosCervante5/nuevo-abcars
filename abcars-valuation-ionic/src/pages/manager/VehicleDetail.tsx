import React, { useState, useEffect } from 'react';
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
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonLoading,
  IonToast,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { save, camera, trash } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle, VehicleImage } from '../../models/Vehicle';
import './VehicleDetail.css';

const VehicleDetail: React.FC = () => {
  const { vehicleUuid } = useParams<{ vehicleUuid: string }>();
  const history = useHistory();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    vin: '',
    sale_price: '',
    list_price: '',
    offer_price: '',
    mileage: '',
    status: 'active',
    exterior_color: '',
    interior_color: '',
    transmission: '',
    fuel_type: '',
    cylinders: '',
  });

  useEffect(() => {
    if (vehicleUuid && vehicleUuid !== 'new') {
      loadVehicle();
    } else {
      setIsEditing(true);
    }
  }, [vehicleUuid]);

  const loadVehicle = async () => {
    if (!vehicleUuid) return;

    try {
      setLoading(true);
      const response = await vehicleService.getVehicleDetail(vehicleUuid);
      if (response.status === 200 && response.data) {
        const vehicleData = response.data;
        setVehicle(vehicleData);
        
        // Cargar imágenes del vehículo (soporta múltiples formatos del backend)
        let vehicleImages: any[] = [];
        
        if (vehicleData.images && Array.isArray(vehicleData.images)) {
          vehicleImages = vehicleData.images;
        } else if ((vehicleData as any).images_data && Array.isArray((vehicleData as any).images_data)) {
          vehicleImages = (vehicleData as any).images_data;
        } else if ((vehicleData as any).images && Array.isArray((vehicleData as any).images)) {
          vehicleImages = (vehicleData as any).images;
        }
        
        console.log('Imágenes del vehículo:', vehicleImages);
        console.log('Número de imágenes:', vehicleImages.length);
        console.log('Datos completos del vehículo:', vehicleData);
        
        setImages(vehicleImages);
        setFormData({
          name: response.data.name || '',
          description: response.data.description || '',
          vin: response.data.vin || '',
          sale_price: response.data.sale_price?.toString() || '',
          list_price: response.data.list_price?.toString() || '',
          offer_price: response.data.offer_price?.toString() || '',
          mileage: response.data.mileage?.toString() || '',
          status: response.data.status || 'active',
          exterior_color: response.data.exterior_color || '',
          interior_color: response.data.interior_color || '',
          transmission: response.data.transmission || '',
          fuel_type: response.data.fuel_type || '',
          cylinders: response.data.cylinders?.toString() || '',
        });
      }
    } catch (error: any) {
      setToastMessage('Error al cargar el vehículo');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (vehicleUuid === 'new') {
        // Validar campos requeridos antes de enviar
        if (!formData.name || !formData.description || !formData.vin || !formData.sale_price || !formData.mileage) {
          setToastMessage('Por favor completa todos los campos requeridos');
          setShowToast(true);
          return;
        }

        const createData: any = {
          name: formData.name,
          description: formData.description,
          vin: formData.vin,
          purchase_date: new Date().toISOString().split('T')[0], // Fecha actual como default
          sale_price: parseFloat(formData.sale_price),
          list_price: formData.list_price ? parseFloat(formData.list_price) : parseFloat(formData.sale_price),
          mileage: parseInt(formData.mileage),
          type: 'car', // Default, debería venir del formulario
          category: 'pre_owned', // Default, debería venir del formulario
          cylinders: formData.cylinders ? parseInt(formData.cylinders) : 4, // Default
          interior_color: formData.interior_color || 'N/A',
          exterior_color: formData.exterior_color || 'N/A',
          transmission: formData.transmission || 'automatic', // Default
          brand: vehicle?.brand?.name || '',
          model: vehicle?.model?.name || '',
          version: vehicle?.version?.name || 'Base', // Default
          body: vehicle?.body?.name || 'Sedan', // Default
          dealership_name: vehicle?.dealership?.name || 'ABCars', // Default
          location: vehicle?.dealership?.location || 'Ciudad de México', // Default
          year: new Date().getFullYear(), // Default al año actual
        };

        // Campos opcionales
        if (formData.offer_price) {
          createData.offer_price = parseFloat(formData.offer_price);
        }
        if (formData.fuel_type) {
          createData.fuel_type = formData.fuel_type;
        }

        console.log('Enviando datos de creación:', JSON.stringify(createData, null, 2));
        console.log('Token actual:', localStorage.getItem('auth_token') ? 'Presente' : 'Ausente');
        
        const response = await vehicleService.createVehicle(createData);
        console.log('Respuesta de creación:', response);
        setToastMessage('Vehículo creado correctamente');
      } else if (vehicleUuid) {
        const updateData: any = {
          vehicle_uuid: vehicleUuid,
          name: formData.name,
          description: formData.description,
          vin: formData.vin,
          sale_price: parseFloat(formData.sale_price),
          list_price: formData.list_price ? parseFloat(formData.list_price) : undefined,
          offer_price: formData.offer_price ? parseFloat(formData.offer_price) : undefined,
          mileage: parseInt(formData.mileage),
          status: formData.status,
          exterior_color: formData.exterior_color,
          interior_color: formData.interior_color,
          transmission: formData.transmission as any,
          fuel_type: formData.fuel_type,
          cylinders: formData.cylinders ? parseInt(formData.cylinders) : undefined,
        };
        await vehicleService.updateVehicle(updateData);
        setToastMessage('Vehículo actualizado correctamente');
      }
      
      setShowToast(true);
      setIsEditing(false);
      if (vehicleUuid === 'new') {
        history.push('/manager/vehicles');
      } else {
        await loadVehicle();
      }
    } catch (error: any) {
      console.error('Error al guardar vehículo:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      // Si es error 401, no limpiar el token aquí, dejar que api.ts lo maneje
      // pero mostrar mensaje más específico
      if (error.response?.status === 401) {
        setToastMessage('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else if (error.response?.status === 422) {
        // Error de validación
        const validationErrors = error.response?.data?.errors || {};
        const errorMessages = Object.values(validationErrors).flat();
        setToastMessage(errorMessages.join(', ') || error.response?.data?.message || 'Error de validación. Verifica los campos requeridos.');
      } else {
        setToastMessage(error.response?.data?.message || 'Error al guardar el vehículo');
      }
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicleUuid || vehicleUuid === 'new') return;
    if (!confirm('¿Estás seguro de eliminar este vehículo?')) return;

    try {
      setSaving(true);
      await vehicleService.deleteVehicle(vehicleUuid);
      setToastMessage('Vehículo eliminado correctamente');
      setShowToast(true);
      history.push('/manager/vehicles');
    } catch (error: any) {
      setToastMessage('Error al eliminar el vehículo');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/manager/vehicles" />
          </IonButtons>
          <IonTitle>
            {vehicleUuid === 'new' ? 'Nuevo Vehículo' : isEditing ? 'Editar Vehículo' : 'Detalle Vehículo'}
          </IonTitle>
          <IonButtons slot="end">
            {!isEditing && vehicleUuid !== 'new' && (
              <>
                <IonButton onClick={() => history.push(`/manager/vehicles/${vehicleUuid}/photos`)}>
                  <IonIcon icon={camera} />
                </IonButton>
                <IonButton onClick={() => setIsEditing(true)}>
                  <IonIcon icon={save} />
                </IonButton>
              </>
            )}
            {isEditing && (
              <IonButton onClick={handleSave} disabled={saving}>
                <IonIcon icon={save} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="vehicle-detail-content">
        <IonLoading isOpen={loading || saving} message={saving ? 'Guardando...' : 'Cargando...'} />

        {vehicle && !isEditing && (
          <div className="vehicle-detail-view">
            {/* Detalle del vehículo - PRIMERO */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  {vehicle.brand?.name} {vehicle.model?.name}
                </IonCardTitle>
                <IonBadge color={vehicle.status === 'active' ? 'success' : 'danger'}>
                  {vehicle.status}
                </IonBadge>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol size="6">
                      <strong>Precio:</strong> {formatPrice(vehicle.sale_price)}
                    </IonCol>
                    <IonCol size="6">
                      <strong>Kilometraje:</strong> {vehicle.mileage?.toLocaleString()} km
                    </IonCol>
                    <IonCol size="12">
                      <strong>VIN:</strong> {vehicle.vin}
                    </IonCol>
                    {vehicle.exterior_color && (
                      <IonCol size="6">
                        <strong>Color Exterior:</strong> {vehicle.exterior_color}
                      </IonCol>
                    )}
                    {vehicle.transmission && (
                      <IonCol size="6">
                        <strong>Transmisión:</strong> {vehicle.transmission}
                      </IonCol>
                    )}
                    {vehicle.interior_color && (
                      <IonCol size="6">
                        <strong>Color Interior:</strong> {vehicle.interior_color}
                      </IonCol>
                    )}
                    {vehicle.fuel_type && (
                      <IonCol size="6">
                        <strong>Combustible:</strong> {vehicle.fuel_type}
                      </IonCol>
                    )}
                    {vehicle.cylinders && (
                      <IonCol size="6">
                        <strong>Cilindros:</strong> {vehicle.cylinders}
                      </IonCol>
                    )}
                    {vehicle.description && (
                      <IonCol size="12">
                        <strong>Descripción:</strong>
                        <p style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{vehicle.description}</p>
                      </IonCol>
                    )}
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>
            
            {/* Imagen principal */}
            {(vehicle.firstImage || (vehicle as any).first_image) && (
              <div className="vehicle-main-image-section">
                <h3 className="gallery-title">Imagen Principal</h3>
                <img
                  src={(vehicle.firstImage || (vehicle as any).first_image)?.service_image_url || (vehicle.firstImage || (vehicle as any).first_image)?.image_path}
                  alt={vehicle.name}
                  className="vehicle-main-image"
                  onError={(e) => {
                    // Si falla la carga, mostrar placeholder o ocultar
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* Galería de imágenes - Mostrar todas las imágenes */}
            <div className="vehicle-gallery-section">
              <h3 className="gallery-title">
                Galería de Imágenes {images.length > 0 && `(${images.length})`}
              </h3>
              {images.length > 0 ? (
                <IonGrid>
                  <IonRow>
                    {images.map((image, index) => {
                      const imageUrl = image.service_image_url || image.image_path || (image as any).service_image_url || (image as any).image_path;
                      return (
                        <IonCol size="6" sizeMd="4" sizeLg="3" key={image.uuid || `image-${index}`}>
                          <div className="gallery-item">
                            <img
                              src={imageUrl}
                              alt={`Imagen ${image.sort_id || index + 1}`}
                              className="gallery-image"
                              onClick={() => {
                                // Abrir imagen en vista completa
                                if (imageUrl) {
                                  window.open(imageUrl, '_blank');
                                }
                              }}
                              onError={(e) => {
                                // Si falla la carga, mostrar placeholder
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTdlOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
                              }}
                            />
                          </div>
                        </IonCol>
                      );
                    })}
                  </IonRow>
                </IonGrid>
              ) : (
                <div className="no-images-message">
                  <p>No hay imágenes disponibles para este vehículo.</p>
                  <IonButton 
                    fill="outline" 
                    onClick={() => history.push(`/manager/vehicles/${vehicleUuid}/photos`)}
                  >
                    <IonIcon icon={camera} slot="start" />
                    Agregar Imágenes
                  </IonButton>
                </div>
              )}
            </div>
          </div>
        )}

        {isEditing && (
          <div className="vehicle-edit-form">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Información del Vehículo</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem>
                  <IonLabel position="stacked">Nombre *</IonLabel>
                  <IonInput
                    value={formData.name}
                    onIonInput={(e) => setFormData({ ...formData, name: e.detail.value || '' })}
                    placeholder="Ej: Chevrolet Aveo 2020"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">VIN *</IonLabel>
                  <IonInput
                    value={formData.vin}
                    onIonInput={(e) => setFormData({ ...formData, vin: e.detail.value || '' })}
                    placeholder="Número de VIN"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Precio de Venta *</IonLabel>
                  <IonInput
                    type="number"
                    value={formData.sale_price}
                    onIonInput={(e) => setFormData({ ...formData, sale_price: e.detail.value || '' })}
                    placeholder="0.00"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Precio de Lista</IonLabel>
                  <IonInput
                    type="number"
                    value={formData.list_price}
                    onIonInput={(e) => setFormData({ ...formData, list_price: e.detail.value || '' })}
                    placeholder="0.00"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Kilometraje *</IonLabel>
                  <IonInput
                    type="number"
                    value={formData.mileage}
                    onIonInput={(e) => setFormData({ ...formData, mileage: e.detail.value || '' })}
                    placeholder="0"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Estado</IonLabel>
                  <IonSelect
                    value={formData.status}
                    onIonChange={(e) => setFormData({ ...formData, status: e.detail.value })}
                  >
                    <IonSelectOption value="active">Activo</IonSelectOption>
                    <IonSelectOption value="sold">Vendido</IonSelectOption>
                    <IonSelectOption value="pending">Pendiente</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Color Exterior</IonLabel>
                  <IonInput
                    value={formData.exterior_color}
                    onIonInput={(e) => setFormData({ ...formData, exterior_color: e.detail.value || '' })}
                    placeholder="Ej: Blanco"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Transmisión</IonLabel>
                  <IonSelect
                    value={formData.transmission}
                    onIonChange={(e) => setFormData({ ...formData, transmission: e.detail.value })}
                  >
                    <IonSelectOption value="automatic">Automática</IonSelectOption>
                    <IonSelectOption value="manual">Manual</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </IonCardContent>
            </IonCard>

            <div className="form-actions">
              <IonButton expand="block" onClick={handleSave} disabled={saving}>
                <IonIcon icon={save} slot="start" />
                {vehicleUuid === 'new' ? 'Crear Vehículo' : 'Guardar Cambios'}
              </IonButton>
              {vehicleUuid !== 'new' && (
                <IonButton expand="block" color="danger" onClick={handleDelete} disabled={saving}>
                  <IonIcon icon={trash} slot="start" />
                  Eliminar Vehículo
                </IonButton>
              )}
            </div>
          </div>
        )}

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

export default VehicleDetail;

