import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonIcon,
  IonSearchbar,
  IonLoading,
  IonToast,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonFab,
  IonFabButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';
import { add, camera, search, car, logOutOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle } from '../../models/Vehicle';
import { authService } from '../../services/authService';
import './VehicleList.css';

const VehicleList: React.FC = () => {
  const history = useHistory();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadVehicles();
  }, [searchTerm]);

  const loadVehicles = async (page: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      console.log('Loading vehicles with params:', { page, per_page: 20, search: searchTerm || undefined });
      const response = await vehicleService.searchVehicles({
        page,
        per_page: 20,
        search: searchTerm || undefined,
      });

      console.log('Vehicle search response:', JSON.stringify(response, null, 2));

      if (response.status === 200 && response.data) {
        const vehiclesData = Array.isArray(response.data.vehicles) ? response.data.vehicles : [];
        console.log('Vehicles data:', vehiclesData.length, 'vehicles found');
        if (append) {
          setVehicles((prev) => [...prev, ...vehiclesData]);
        } else {
          setVehicles(vehiclesData);
        }
        setCurrentPage(response.data.current_page || 1);
        setTotalPages(response.data.last_page || 1);
      } else {
        console.warn('Response status not 200 or no data:', response);
        setVehicles([]);
        setToastMessage(response.message || 'Error al cargar vehículos');
        setShowToast(true);
      }
    } catch (error: any) {
      console.error('Error loading vehicles:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      setToastMessage(error.response?.data?.message || 'Error al cargar vehículos');
      setShowToast(true);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadVehicles(1, false);
    event.detail.complete();
  };

  const loadMore = async (event: CustomEvent<void>) => {
    if (currentPage < totalPages) {
      await loadVehicles(currentPage + 1, true);
    }
    (event.target as HTMLIonInfiniteScrollElement).complete();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'activo':
        return 'success';
      case 'sold':
      case 'vendido':
        return 'danger';
      case 'pending':
      case 'pendiente':
        return 'warning';
      default:
        return 'medium';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      currencyDisplay: 'code',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Inventario</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => authService.logout()}>
              <IonIcon icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <IonLoading isOpen={loading && vehicles.length === 0} message="Cargando inventario..." />

        <div className="vehicle-list-container">
          <IonSearchbar
            value={searchTerm}
            onIonInput={(e) => handleSearch(e.detail.value || '')}
            placeholder="Buscar vehículo..."
            className="vehicle-searchbar"
          />

          {vehicles.length === 0 && !loading ? (
            <div className="empty-state">
              <IonIcon icon={car} size="large" color="medium" />
              <p>No se encontraron vehículos</p>
              <IonButton onClick={() => history.push('/manager/vehicles/new')}>
                <IonIcon icon={add} slot="start" />
                Agregar Vehículo
              </IonButton>
            </div>
          ) : (
            <>
              <div className="vehicles-grid">
                {vehicles.map((vehicle) => {
                  // Obtener la imagen (soporta ambos formatos: firstImage y first_image)
                  const vehicleImage = vehicle.firstImage || (vehicle as any).first_image;
                  
                  return (
                    <IonCard
                      key={vehicle.uuid}
                      className="vehicle-card"
                      onClick={() => history.push(`/manager/vehicles/${vehicle.uuid}`)}
                    >
                      <div className="vehicle-card-image-container">
                        {vehicleImage ? (
                          <img
                            src={vehicleImage.service_image_url || vehicleImage.image_path}
                            alt={vehicle.name}
                            className="vehicle-card-image"
                            onError={(e) => {
                              // Si falla la carga, mostrar placeholder
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const placeholder = target.nextElementSibling as HTMLElement;
                              if (placeholder) {
                                placeholder.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className="vehicle-card-image-placeholder"
                          style={{ display: vehicleImage ? 'none' : 'flex' }}
                        >
                          <IonIcon icon={car} size="large" />
                          <span>Sin imagen</span>
                        </div>
                      </div>
                    <IonCardHeader>
                      <div className="vehicle-card-header">
                        <IonCardTitle className="vehicle-card-title">
                          {vehicle.brand?.name} {vehicle.model?.name}
                        </IonCardTitle>
                        <IonBadge color={getStatusColor(vehicle.status)}>
                          {vehicle.status}
                        </IonBadge>
                      </div>
                    </IonCardHeader>
                    <IonCardContent>
                      <div className="vehicle-card-info">
                        <p className="vehicle-price">{formatPrice(vehicle.sale_price)}</p>
                        <p className="vehicle-details">
                          {vehicle.mileage?.toLocaleString()} km • {vehicle.version?.name || 'N/A'}
                        </p>
                        <p className="vehicle-vin">VIN: {vehicle.vin}</p>
                      </div>
                    </IonCardContent>
                  </IonCard>
                  );
                })}
              </div>

              <IonInfiniteScroll onIonInfinite={loadMore} threshold="100px">
                <IonInfiniteScrollContent
                  loadingText="Cargando más vehículos..."
                ></IonInfiniteScrollContent>
              </IonInfiniteScroll>
            </>
          )}
        </div>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/manager/vehicles/new')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

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

export default VehicleList;

