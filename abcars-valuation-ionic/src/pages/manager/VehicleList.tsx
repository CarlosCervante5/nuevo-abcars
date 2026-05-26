import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useIonViewWillEnter } from '@ionic/react';
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
import VehicleIaBatchBanner from '../../components/VehicleIaBatchBanner';
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchTermRef = useRef(searchTerm);
  searchTermRef.current = searchTerm;

  const loadVehicles = useCallback(async (page: number = 1, append: boolean = false) => {
    searchAbortRef.current?.abort();
    const ac = new AbortController();
    searchAbortRef.current = ac;

    const timeoutId = window.setTimeout(() => ac.abort(), 60000);

    try {
      setLoading(true);
      setLoadError(null);
      console.log('Loading vehicles with params:', {
        page,
        per_page: 20,
        search: searchTermRef.current || undefined,
      });
      const response = await vehicleService.searchVehicles(
        {
          page,
          per_page: 20,
          search: searchTermRef.current || undefined,
          status: 'active,inactive',
          has_images: false,
        },
        { signal: ac.signal },
      );

      console.log('Vehicle search response:', JSON.stringify(response, null, 2));

      if (Number(response.status) === 200 && response.data) {
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
    } catch (error: unknown) {
      if (ac.signal.aborted) {
        if (searchAbortRef.current !== ac) {
          return;
        }
        if (!append) {
          setLoadError(
            'La carga tardó demasiado. Si hay IA en segundo plano, espera un momento y pulsa Reintentar.',
          );
        }
        return;
      }
      console.error('Error loading vehicles:', error);
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
        code?: string;
      };
      const msg =
        err?.response?.data?.message ||
        (err?.message === 'Network Error'
          ? 'Sin conexión. Revisa datos/Wi‑Fi y que la API responda.'
          : err?.message) ||
        'Error al cargar vehículos';
      setLoadError(msg);
      setToastMessage(msg);
      setShowToast(true);
      if (!append) {
        setVehicles([]);
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (searchAbortRef.current === ac) {
        setLoading(false);
      }
    }
  }, []);

  const skipViewEnterReload = useRef(true);

  useEffect(() => {
    void loadVehicles(1, false);
    return () => searchAbortRef.current?.abort();
  }, [searchTerm, loadVehicles]);

  useIonViewWillEnter(() => {
    if (skipViewEnterReload.current) {
      skipViewEnterReload.current = false;
      return;
    }
    void loadVehicles(1, false);
  });

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
    return `MX$ ${price.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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

        <div className="ion-padding-horizontal ion-padding-top">
          <VehicleIaBatchBanner />
        </div>

        <IonLoading isOpen={loading && vehicles.length === 0} message="Cargando inventario..." />

        <div className="vehicle-list-container">
          <IonSearchbar
            value={searchTerm}
            onIonInput={(e) => handleSearch(e.detail.value || '')}
            placeholder="Buscar vehículo..."
            className="vehicle-searchbar"
          />

          {loadError && !loading ? (
            <div className="empty-state">
              <IonIcon icon={car} size="large" color="warning" />
              <p>{loadError}</p>
              <IonButton onClick={() => void loadVehicles(1, false)}>
                Reintentar
              </IonButton>
            </div>
          ) : null}

          {vehicles.length === 0 && !loading && !loadError ? (
            <div className="empty-state">
              <IonIcon icon={car} size="large" color="medium" />
              <p>No se encontraron vehículos</p>
              <IonButton onClick={() => history.push('/manager/vehicles/new')}>
                <IonIcon icon={add} slot="start" />
                Agregar Vehículo
              </IonButton>
            </div>
          ) : vehicles.length > 0 ? (
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
          ) : null}
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

