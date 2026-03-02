import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonSearchbar,
  IonLoading,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  RefresherEventDetail,
} from '@ionic/react';
import { car, notificationsOutline, logInOutline } from 'ionicons/icons';

const LOGO_ABCARS = '/logo.svg';
import { useHistory } from 'react-router-dom';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle } from '../../models/Vehicle';
import './PublicInventoryList.css';

const CATEGORIES = [
  { id: 'all', label: 'Todos', bodyNames: [] },
  { id: 'sedan', label: 'Sedanes', bodyNames: ['sedan', 'sedán', 'compacto'] },
  { id: 'suv', label: 'SUVs', bodyNames: ['suv', 'crossover', 'camioneta'] },
  { id: 'truck', label: 'Camionetas', bodyNames: ['pickup', 'truck', 'camioneta'] },
];

const translateFuelType = (type: string): string => {
  const map: Record<string, string> = {
    gasoline: 'GASOLINA', diesel: 'DIÉSEL', electric: 'ELÉCTRICO',
    hybrid: 'HÍBRIDO', hydrogen: 'HIDRÓGENO', natural_gas: 'GAS NATURAL',
  };
  return map[type?.toLowerCase()] || type?.toUpperCase() || 'GASOLINA';
};

const PublicInventoryList: React.FC = () => {
  const history = useHistory();
  const isAuthenticated = !!localStorage.getItem('auth_token');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadVehicles();
  }, [searchTerm, selectedCategory]);

  const loadVehicles = async (page: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      const category = CATEGORIES.find((c) => c.id === selectedCategory);
      const params: any = {
        page,
        per_page: 20,
        search: searchTerm || undefined,
        status: 'active,sale',
      };
      if (category?.bodyNames?.length) {
        params.body_names = category.bodyNames.join(',');
      }
      const response = await vehicleService.searchVehicles(params);

      if (response.status === 200 && response.data) {
        const vehiclesData = response.data.vehicles || [];
        if (append) {
          setVehicles((prev) => [...prev, ...vehiclesData]);
        } else {
          setVehicles(vehiclesData);
        }
        setCurrentPage(response.data.current_page || 1);
        setTotalPages(response.data.last_page || 1);
      } else {
        setVehicles([]);
        setToastMessage(response.message || 'Error al cargar vehículos');
        setShowToast(true);
      }
    } catch (error: any) {
      console.error('Error loading vehicles:', error);
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

  const toggleFavorite = (e: React.MouseEvent, uuid: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
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

  const getDriveLabel = (vehicle: Vehicle) => {
    return vehicle.drive_train || vehicle.transmission || 'N/D';
  };

  return (
    <IonPage>
      <IonHeader className="public-inventory-header">
        <IonToolbar className="public-inventory-toolbar">
          <div className="header-content">
            <div className="logo-section">
              <img src={LOGO_ABCARS} alt="ABCars" className="logo-img" />
            </div>
            {isAuthenticated ? (
              <IonIcon icon={notificationsOutline} className="header-icon" />
            ) : (
              <button className="header-login-btn" onClick={() => history.push('/login')}>
                <IonIcon icon={logInOutline} />
                <span>Iniciar sesión</span>
              </button>
            )}
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <IonLoading isOpen={loading && vehicles.length === 0} message="Cargando inventario..." />

        <div className="public-inventory-container">
          <div className="search-section">
            <IonSearchbar
              value={searchTerm}
              onIonInput={(e) => handleSearch(e.detail.value || '')}
              placeholder="Buscar modelo, año o tipo"
              className="public-searchbar"
            />
          </div>

          <div className="categories-section">
            <div className="categories-header">
              <span className="section-label">CATEGORÍAS</span>
              <span className="view-all">VER TODO</span>
            </div>
            <div className="categories-scroll">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCurrentPage(1);
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="inventory-section">
            <h2 className="section-title">Último inventario</h2>
            {vehicles.length === 0 && !loading ? (
              <div className="empty-state">
                <IonIcon icon={car} size="large" className="empty-icon" />
                <p>No se encontraron vehículos</p>
              </div>
            ) : (
              <div className="vehicle-cards">
                {vehicles.map((vehicle) => {
                  const vehicleImage = vehicle.firstImage || (vehicle as any).first_image;
                  const imgUrl = vehicleImage?.service_image_url || vehicleImage?.image_path;
                  const isFavorite = favorites.has(vehicle.uuid);
                  const badge = vehicle.category === 'new' ? 'NUEVO' : vehicle.status === 'sale' ? 'DESTACADO' : null;

                  return (
                    <div
                      key={vehicle.uuid}
                      className="vehicle-card"
                      onClick={() => history.push(`/inventory/${vehicle.uuid}`)}
                    >
                      <div className="vehicle-card-image-wrap">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={vehicle.name}
                            className="vehicle-card-image"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const ph = target.nextElementSibling as HTMLElement;
                              if (ph) ph.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="vehicle-card-placeholder"
                          style={{ display: imgUrl ? 'none' : 'flex' }}
                        >
                          <IonIcon icon={car} />
                          <span>Sin imagen</span>
                        </div>
                        {badge && (
                          <span className={`vehicle-badge ${badge === 'NUEVO' ? 'new' : 'featured'}`}>
                            {badge}
                          </span>
                        )}
                        <button
                          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                          onClick={(e) => toggleFavorite(e, vehicle.uuid)}
                          aria-label="Favorito"
                        >
                          <svg viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>
                      </div>
                      <div className="vehicle-card-body">
                        <div className="vehicle-card-title-row">
                          <h3 className="vehicle-card-title">
                            {vehicle.brand?.name} {vehicle.model?.name}
                          </h3>
                          <span className="vehicle-card-price">{formatPrice(vehicle.sale_price)}</span>
                        </div>
                        <p className="vehicle-card-specs">
                          {vehicle.model?.year || 'N/D'} • {vehicle.mileage?.toLocaleString()} km • {getDriveLabel(vehicle)}
                        </p>
                        <div className="vehicle-card-badges">
                          <span className="spec-badge">
                            <IonIcon icon={car} />
                            {vehicle.cylinders ? `${vehicle.cylinders} HP` : vehicle.fuel_type || 'N/A'}
                          </span>
                          <span className="spec-badge">
                            {vehicle.fuel_type ? translateFuelType(vehicle.fuel_type) : 'GASOLINA'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

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

export default PublicInventoryList;
