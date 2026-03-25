import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonLoading,
  IonToast,
} from '@ionic/react';
import { arrowBack, shareSocialOutline, heart, calculatorOutline, cardOutline, chevronBackOutline, chevronForwardOutline, locationOutline, constructOutline, flashOutline, speedometerOutline, car } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle, VehicleImage } from '../../models/Vehicle';
import SimulatorModal, { SimulatorData } from '../../components/SimulatorModal';
import FinancingFormModal from '../../components/FinancingFormModal';
import './PublicVehicleDetail.css';

const translateFuelType = (type?: string): string => {
  if (!type) return 'Gasolina';
  const map: Record<string, string> = {
    gasoline: 'Gasolina', gasolina: 'Gasolina', diesel: 'Diésel', diésel: 'Diésel',
    electric: 'Eléctrico', eléctrico: 'Eléctrico', hybrid: 'Híbrido', híbrido: 'Híbrido',
    hydrogen: 'Hidrógeno', natural_gas: 'Gas natural', gas: 'Gas natural',
  };
  return map[type?.toLowerCase().trim()] || type;
};

const translateTransmission = (type?: string): string => {
  if (!type) return 'N/D';
  const map: Record<string, string> = {
    automatic: 'Automática', automatico: 'Automática', automática: 'Automática',
    manual: 'Manual', semiautomatic: 'Semi automática', semiautomática: 'Semi automática',
    cvt: 'CVT', triptronic: 'Tiptronic', 'dual-clutch': 'Doble embrague',
    dual_clutch: 'Doble embrague',
  };
  return map[type?.toLowerCase().trim()] || type;
};

const translateDriveTrain = (type?: string): string => {
  if (!type) return '';
  const map: Record<string, string> = {
    fwd: 'Tracción delantera', rwd: 'Tracción trasera', awd: 'Tracción integral',
    '4wd': '4x4', '4x4': '4x4',
  };
  return map[type?.toLowerCase().trim()] || type;
};

const PublicVehicleDetail: React.FC = () => {
  const { vehicleUuid } = useParams<{ vehicleUuid: string }>();
  const history = useHistory();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const touchStartX = useRef(0);
  const isDragging = useRef(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [showFinancingModal, setShowFinancingModal] = useState(false);
  const [simulatorData, setSimulatorData] = useState<SimulatorData | null>(null);

  useEffect(() => {
    if (vehicleUuid) {
      loadVehicle();
    }
  }, [vehicleUuid]);

  const loadVehicle = async () => {
    if (!vehicleUuid) return;
    try {
      setLoading(true);
      const response = await vehicleService.getVehicleDetail(vehicleUuid);
      if (response.status === 200 && response.data) {
        const v = response.data;
        setVehicle(v);
        const imgs = v.images || (v as any).images_data || [];
        setImages(imgs);
      } else {
        setToastMessage('Error al cargar el vehículo');
        setShowToast(true);
      }
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || 'Error al cargar el vehículo');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `MX$ ${price.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getDisplayImage = () => {
    if (images.length > 0 && images[currentImageIndex]) {
      const img = images[currentImageIndex];
      return img.service_image_url || (img as any).image_path;
    }
    const firstImg = vehicle?.firstImage || (vehicle as any)?.first_image;
    return firstImg?.service_image_url || firstImg?.image_path;
  };

  const getEngineDisplay = () => {
    const spec = (vehicle as any)?.specification;
    if (spec?.intake_engine) return spec.intake_engine;
    if (spec?.engine_type) return spec.engine_type;
    return vehicle?.cylinders ? `${vehicle.cylinders}L` : 'N/D';
  };

  const getKeyFeatures = (): string[] => {
    const features: string[] = [];
    // Agregar características basadas en los datos disponibles (traducidas)
    if (vehicle?.transmission) features.push(translateTransmission(vehicle.transmission));
    const dt = translateDriveTrain(vehicle?.drive_train);
    if (dt) features.push(dt);
    if (vehicle?.fuel_type) features.push(translateFuelType(vehicle.fuel_type));
    if (vehicle?.interior_color) features.push(`Interior ${vehicle.interior_color}`);
    if (vehicle?.exterior_color) features.push(`Exterior ${vehicle.exterior_color}`);
    return features.length > 0 ? features : ['Cámara de reversa', 'Monitor de punto ciego', 'Apple CarPlay', 'Techo solar'];
  };

  const handleShare = async () => {
    if (!vehicle) return;
    try {
      const shareUrl = Capacitor.isNativePlatform()
        ? `${window.location.origin}/inventory/${vehicle.uuid}`
        : window.location.href;
      await Share.share({
        title: `${vehicle.brand?.name} ${vehicle.model?.name}`,
        text: vehicle.description || `Vehículo en venta - ${formatPrice(vehicle.sale_price)}`,
        url: shareUrl,
        dialogTitle: 'Compartir vehículo',
      });
      setToastMessage('Compartido correctamente');
      setShowToast(true);
    } catch (err: any) {
      if (err?.message !== 'Share canceled') {
        setToastMessage('No se pudo compartir');
        setShowToast(true);
      }
    }
  };

  const handleSimulador = () => setShowSimulatorModal(true);

  const handleSolicitarFinanciamiento = () => {
    setSimulatorData(null);
    setShowFinancingModal(true);
  };

  const handleRequestFinancingFromSimulator = (data: SimulatorData) => {
    setSimulatorData(data);
    setShowSimulatorModal(false);
    setShowFinancingModal(true);
  };

  const displayImages = images.length > 0 ? images : (vehicle?.firstImage ? [vehicle.firstImage] : []);

  const prevImage = () => {
    if (displayImages.length <= 1) return;
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1));
  };

  const nextImage = () => {
    if (displayImages.length <= 1) return;
    setCurrentImageIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (displayImages.length <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const minSwipe = 50;
    if (Math.abs(diff) > minSwipe) {
      if (diff > 0) nextImage();
      else prevImage();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (displayImages.length <= 1) return;
    touchStartX.current = e.clientX;
    isDragging.current = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current || displayImages.length <= 1) return;
    const diff = touchStartX.current - e.clientX;
    const minSwipe = 50;
    if (Math.abs(diff) > minSwipe) {
      if (diff > 0) nextImage();
      else prevImage();
    }
    isDragging.current = false;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  if (!vehicle && !loading) return null;
  const imgUrl = getDisplayImage();

  return (
    <IonPage>
      <IonHeader className="public-detail-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/inventory" text="" icon={arrowBack} />
          </IonButtons>
          <IonButtons slot="end">
            <IonButton onClick={handleShare}>
              <IonIcon icon={shareSocialOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonLoading isOpen={loading} message="Cargando..." />

        {vehicle && (
          <div className="public-detail-container">
            {/* Image carousel */}
            <div className="detail-image-section">
              <div
                className="detail-image-wrap"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                role="region"
                aria-label="Galería de imágenes, desliza para ver más"
              >
                {imgUrl ? (
                  <img src={imgUrl} alt={vehicle.name} className="detail-image" />
                ) : (
                  <div className="detail-image-placeholder">
                    <IonIcon icon={car} size="large" />
                    <span>Sin imagen</span>
                  </div>
                )}
                {vehicle.category === 'new' && (
                  <span className="detail-badge">NUEVO</span>
                )}
                {displayImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="carousel-btn carousel-prev"
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      aria-label="Imagen anterior"
                    >
                      <IonIcon icon={chevronBackOutline} />
                    </button>
                    <button
                      type="button"
                      className="carousel-btn carousel-next"
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      aria-label="Siguiente imagen"
                    >
                      <IonIcon icon={chevronForwardOutline} />
                    </button>
                    <div className="image-counter">
                      {currentImageIndex + 1}/{displayImages.length}
                    </div>
                    <span className="swipe-hint">Desliza</span>
                  </>
                )}
              </div>
              {displayImages.length > 1 && (
                <div className="carousel-dots">
                  {displayImages.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`dot ${i === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(i)}
                      aria-label={`Imagen ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Core info */}
            <div className="detail-info-section">
              <p className="detail-brand">{vehicle.brand?.name?.toUpperCase()}</p>
              <div className="detail-title-row">
                <h1 className="detail-title">
                  {vehicle.model?.name} {vehicle.version?.name || ''} {vehicle.model?.year || ''}
                </h1>
                <button
                  className={`detail-favorite-btn ${isFavorite ? 'active' : ''}`}
                  onClick={() => setIsFavorite(!isFavorite)}
                  aria-label="Favorito"
                >
                  <IonIcon icon={heart} />
                </button>
              </div>
              <p className="detail-price">
                {formatPrice(vehicle.sale_price)}
              </p>
            </div>

            {/* Specs grid */}
            <div className="detail-specs-grid">
              <div className="spec-card">
                <IonIcon icon={constructOutline} className="spec-icon" />
                <span className="spec-label">MOTOR</span>
                <span className="spec-value">{getEngineDisplay()}</span>
              </div>
              <div className="spec-card">
                <IonIcon icon={constructOutline} className="spec-icon" />
                <span className="spec-label">TRANSMISIÓN</span>
                <span className="spec-value">{translateTransmission(vehicle.transmission) || 'N/D'}</span>
              </div>
              <div className="spec-card">
                <IonIcon icon={flashOutline} className="spec-icon" />
                <span className="spec-label">COMBUSTIBLE</span>
                <span className="spec-value">{translateFuelType(vehicle.fuel_type) || 'Gasolina'}</span>
              </div>
              <div className="spec-card">
                <IonIcon icon={speedometerOutline} className="spec-icon" />
                <span className="spec-label">KILOMETRAJE</span>
                <span className="spec-value">{vehicle.mileage?.toLocaleString() || 'N/D'} km</span>
              </div>
            </div>

            {/* Description */}
            <div className="detail-description-section">
              <h2 className="detail-section-title">Descripción</h2>
              <p className={`detail-description ${descriptionExpanded ? 'expanded' : ''}`}>
                {vehicle.description || 'Este vehículo ofrece una combinación perfecta de confort, rendimiento y seguridad. Incluye asientos de piel, sistema de sonido JBL premium y tecnología de seguridad avanzada. Un solo dueño, título limpio y meticulosamente mantenido.'}
              </p>
              <button
                className="read-more-btn"
                onClick={() => setDescriptionExpanded(!descriptionExpanded)}
              >
                {descriptionExpanded ? 'Leer menos' : 'Leer más'}
                <span className={`arrow ${descriptionExpanded ? 'up' : ''}`}>▼</span>
              </button>
            </div>

            {/* Key features */}
            <div className="detail-features-section">
              <h2 className="detail-section-title">Características principales</h2>
              <div className="features-pills">
                {getKeyFeatures().map((f, i) => (
                  <span key={i} className="feature-pill">{f}</span>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="detail-location-section">
              <h2 className="detail-section-title">Ubicación</h2>
              <div className="location-info">
                <IonIcon icon={locationOutline} className="location-icon" />
                <span>ABC Cars, {vehicle.dealership?.location || 'Ciudad de México'}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="detail-actions">
              <button className="action-btn secondary" onClick={handleSimulador}>
                <IonIcon icon={calculatorOutline} />
                Simulador
              </button>
              <button className="action-btn primary" onClick={handleSolicitarFinanciamiento}>
                <IonIcon icon={cardOutline} />
                Solicitar financiamiento
              </button>
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

        <SimulatorModal
          isOpen={showSimulatorModal}
          onClose={() => setShowSimulatorModal(false)}
          initialPrice={vehicle?.sale_price}
          onRequestFinancing={handleRequestFinancingFromSimulator}
        />

        <FinancingFormModal
          isOpen={showFinancingModal}
          onClose={() => setShowFinancingModal(false)}
          vehicle={vehicle}
          simulatorData={simulatorData}
          onSuccess={() => {
            setToastMessage('Solicitud enviada. Nos pondremos en contacto contigo pronto.');
            setShowToast(true);
          }}
          onError={(msg) => {
            setToastMessage(msg);
            setShowToast(true);
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default PublicVehicleDetail;
