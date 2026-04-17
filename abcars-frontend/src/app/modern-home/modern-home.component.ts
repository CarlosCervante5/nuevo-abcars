import { Component, OnDestroy, OnInit, CUSTOM_ELEMENTS_SCHEMA, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { register } from 'swiper/element/bundle';

register();
import { VehicleCardComponent } from './vehicle-card/vehicle-card.component';
import { HomeNavComponent } from '../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../shared/components/modern-footer/modern-footer.component';
import { VehicleService, resolveVehicleTypesFilter } from '../shared/services/vehicle.service';
import { CampaingService } from '../shared/services/campaing.service';
import { CompraTuAutoService } from '@services/compra-tu-auto.service';
import { DeliveryPhotosService, DeliveryPhoto } from '@services/delivery-photos.service';
import { Vehicle as ApiVehicle, Brand } from '../shared/interfaces/vehicle_data.interface';
import { Dealership } from '../shared/interfaces/admin.interfaces';
import { sortDealershipsForPublic, branchPublicTitle } from '../shared/utils/public-dealerships';
import { FALLBACK_HERO_IMAGE } from '../shared/constants/fallback-media';

interface Vehicle {
  id?: number;
  uuid?: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: string;
  transmission: string;
  status: string;
  image_url?: string;
  certification?: string;
  name?: string;
  apiData?: ApiVehicle;
}

interface FAQ {
  question: string;
  answer: string;
  isOpen: boolean;
}

interface QuickFilter {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-modern-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, VehicleCardComponent, HomeNavComponent, ModernFooterComponent],
  templateUrl: './modern-home.component.html',
  styleUrls: ['./modern-home.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-in-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class ModernHomeComponent implements OnInit, OnDestroy {
  
  // Propiedades de búsqueda
  searchTerm: string = '';
  selectedCategory: string = 'all';
  selectedBrand: string = '';
  selectedModel: string = '';
  selectedPriceRange: string = '';
  searchLocation: string = '';
  /** Buscador avanzado: incluir autos/camionetas (car, truck, other en API). */
  includeVehicleAuto = true;
  /** Incluir motocicletas (type=moto). */
  includeVehicleMoto = true;
  sortBy: string = 'newest';
  activeFilters: string[] = [];
  
  // Datos de vehículos
  vehicles: (Vehicle | { type: 'banner'; imageUrl?: string })[] = [];
  filteredVehicles: (Vehicle | { type: 'banner'; imageUrl?: string })[] = [];
  totalVehicles: number = 0;
  isLoading: boolean = true;
  loadError: string = '';
  activePromotionImages: string[] = [];
  
  /** Catálogo de marcas (API) para filtrar sobre todo el inventario */
  inventoryBrands: Brand[] = [];
  /** Modelos únicos de la marca seleccionada (API line_models) */
  inventoryModelNames: string[] = [];
  /** Ubicaciones (ciudad) de sucursales que tienen al menos un vehículo activo; respeta marca / modelo / precio seleccionados */
  inventoryLocationOptions: string[] = [];
  loadingLocations = false;
  private readonly locationsPageSize = 200;
  private readonly locationsMaxPages = 25;
  private locationsRequestSeq = 0;

  // Hero: última URL remota en localStorage → pinta al instante (HTTP cache del navegador); sin caché → default ya, sin bloque negro
  heroImagePath: string = 'assets/images/bg_hero.jpg';
  showHeroText: boolean = true;
  /** Tras init siempre true (default o URL en caché). */
  heroBannerReady = false;
  private heroBannerLoadGen = 0;
  private readonly heroBannerStorageKey = 'abcars_hero_main_banner_v1';

  // Filtros rápidos
  quickFilters: QuickFilter[] = [
    { key: 'premium', label: 'Premium', icon: 'star' },
    { key: 'eco', label: 'Eco-friendly', icon: 'leaf' },
    { key: 'low-mileage', label: 'Bajo kilometraje', icon: 'car' },
    { key: 'recent', label: 'Recientes', icon: 'new' }
  ];

  // Categorías de vehículos
  vehicleCategories = [
    { key: 'all', label: 'Todas las condiciones' },
    { key: 'certified', label: 'Usados Certificados' },
    { key: 'new', label: 'Nuevos' },
    { key: 'used', label: 'Usados' },
    { key: 'value', label: 'Valúa mi auto' }
  ];

  // Servicios ABCars
  abcarsServices: FAQ[] = [
    {
      question: 'Tomamos tu auto a cuenta',
      answer: 'Tomamos a cuenta tu vehículo actual al mejor precio del mercado. Lo evaluamos de forma gratuita y te ofrecemos una cotización competitiva en el momento.',
      isOpen: false
    },
    {
      question: 'Financiamiento',
      answer: 'Ofrecemos las mejores opciones de financiamiento automotriz con tasas preferenciales. Créditos flexibles adaptados a tu capacidad de pago con plazos de hasta 60 meses.',
      isOpen: false
    },
    {
      question: 'Servicio automotriz',
      answer: 'Taller especializado con técnicos certificados para el mantenimiento integral de tu vehículo. Servicios de mecánica, electricidad, pintura y refacciones originales.',
      isOpen: false
    },
    {
      question: 'Seguros',
      answer: 'Contamos con alianzas estratégicas con las mejores aseguradoras del país. Te ayudamos a encontrar el seguro perfecto para tu vehículo con coberturas completas.',
      isOpen: false
    }
  ];

  /** Sucursales reales para el bloque «Nuestras Sucursales» (API /dealerships/search). */
  homeDealerships: Dealership[] = [];

  deliveryPhotos: DeliveryPhoto[] = [];
  deliveryPhotosLoading = false;
  deliveryCarouselSlidesPerView = 4;
  deliveryPhotosCurrentPage = 1;
  deliveryPhotosLastPage = 1;
  deliveryPhotosTotal = 0;
  readonly deliveryPhotosPerPage = 10;

  constructor(
    private router: Router,
    private vehicleService: VehicleService,
    private campaingService: CampaingService,
    private compraTuAutoService: CompraTuAutoService,
    private deliveryPhotosService: DeliveryPhotosService
  ) {}

  ngOnDestroy(): void {
    this.heroBannerLoadGen++;
  }

  ngOnInit() {
    this.updateDeliveryCarouselSlides();
    this.hydrateHeroBannerFromStorage();
    if (!this.heroBannerReady) {
      this.applyDefaultHeroBanner();
    }
    this.loadMainBanner();
    // Cargar promociones primero, los vehículos se cargarán cuando las promociones estén listas
    this.loadActivePromotions();
    this.loadInventoryBrands();
    this.loadInventoryLocations();
    this.loadHomeDealerships();
    // Cargar fotos de entregas para el carrusel
    this.loadDeliveryPhotos();
  }

  readonly branchPublicTitle = branchPublicTitle;

  loadHomeDealerships(): void {
    this.vehicleService.searchDealerships().subscribe({
      next: (res) => {
        const list = res?.data;
        if (!Array.isArray(list)) {
          this.homeDealerships = [];
          return;
        }
        this.homeDealerships = sortDealershipsForPublic(list);
      },
      error: () => {
        this.homeDealerships = [];
      }
    });
  }

  @HostListener('window:resize')
  updateDeliveryCarouselSlides() {
    const w = window.innerWidth;
    if (w < 640) {
      this.deliveryCarouselSlidesPerView = 1;
    } else if (w < 1024) {
      this.deliveryCarouselSlidesPerView = 2;
    } else {
      this.deliveryCarouselSlidesPerView = 4;
    }
  }

  /** Tras subir fotos en admin, al volver a esta pestaña se actualiza el carrusel sin recargar la página. */
  @HostListener('document:visibilitychange')
  onDocumentVisibilityChange(): void {
    if (typeof document === 'undefined' || document.visibilityState !== 'visible') {
      return;
    }
    this.loadDeliveryPhotos(this.deliveryPhotosCurrentPage);
    this.loadMainBanner();
    this.loadHomeDealerships();
  }

  loadDeliveryPhotos(page = 1) {
    this.deliveryPhotosLoading = true;
    this.deliveryPhotosService.list(page, this.deliveryPhotosPerPage).subscribe({
      next: (resp) => {
        const d = resp?.data;
        if (d && Array.isArray(d.data)) {
          this.deliveryPhotos = d.data;
          this.deliveryPhotosCurrentPage = d.current_page ?? 1;
          this.deliveryPhotosLastPage = d.last_page ?? 1;
          this.deliveryPhotosTotal = d.total ?? 0;
        } else {
          this.deliveryPhotos = [];
          this.deliveryPhotosTotal = 0;
          this.deliveryPhotosLastPage = 1;
        }
        this.deliveryPhotosLoading = false;
      },
      error: () => {
        this.deliveryPhotos = [];
        this.deliveryPhotosLoading = false;
      }
    });
  }

  deliveryPhotosPrevPage() {
    if (this.deliveryPhotosCurrentPage > 1) {
      this.loadDeliveryPhotos(this.deliveryPhotosCurrentPage - 1);
    }
  }

  deliveryPhotosNextPage() {
    if (this.deliveryPhotosCurrentPage < this.deliveryPhotosLastPage) {
      this.loadDeliveryPhotos(this.deliveryPhotosCurrentPage + 1);
    }
  }

  loadMainBanner(): void {
    const gen = ++this.heroBannerLoadGen;

    this.compraTuAutoService.loadMainBanner('Imagen banner principal').subscribe({
      next: (resp) => {
        if (gen !== this.heroBannerLoadGen) {
          return;
        }
        const url = (resp?.data?.image_path || '').trim();

        if (!url || !this.isPersistableBannerImageUrl(url)) {
          this.clearHeroBannerStorage();
          this.applyDefaultHeroBanner();
          return;
        }

        if (this.heroImagePath === url && this.heroBannerReady && !this.showHeroText) {
          this.persistHeroBannerUrl(url);
          return;
        }

        const img = new Image();
        img.onload = () => {
          if (gen !== this.heroBannerLoadGen) {
            return;
          }
          this.heroImagePath = url;
          this.showHeroText = false;
          this.heroBannerReady = true;
          this.persistHeroBannerUrl(url);
        };
        img.onerror = () => {
          if (gen !== this.heroBannerLoadGen) {
            return;
          }
          this.clearHeroBannerStorage();
          this.applyDefaultHeroBanner();
        };
        img.src = url;
      },
      error: (error) => {
        if (gen !== this.heroBannerLoadGen) {
          return;
        }
        console.warn('Error al cargar el banner principal, usando imagen por defecto:', error);
        if (this.heroBannerReady && !this.showHeroText && this.isPersistableBannerImageUrl(this.heroImagePath)) {
          return;
        }
        this.clearHeroBannerStorage();
        this.applyDefaultHeroBanner();
      }
    });
  }

  private hydrateHeroBannerFromStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      const raw = localStorage.getItem(this.heroBannerStorageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as { url?: string };
      const url = (parsed?.url || '').trim();
      if (!url || !this.isPersistableBannerImageUrl(url)) {
        this.clearHeroBannerStorage();
        return;
      }
      this.heroImagePath = url;
      this.showHeroText = false;
      this.heroBannerReady = true;
    } catch {
      this.clearHeroBannerStorage();
    }
  }

  private persistHeroBannerUrl(url: string): void {
    if (typeof localStorage === 'undefined' || !this.isPersistableBannerImageUrl(url)) {
      return;
    }
    try {
      localStorage.setItem(this.heroBannerStorageKey, JSON.stringify({ url, savedAt: Date.now() }));
    } catch {
      /* quota / privado */
    }
  }

  private clearHeroBannerStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(this.heroBannerStorageKey);
    } catch {
      /* ignore */
    }
  }

  /** URL absoluta, protocolo-relativo, o ruta absoluta en el mismo sitio (p. ej. /storage/...). */
  private isPersistableBannerImageUrl(url: string): boolean {
    const u = url.trim();
    if (!u) {
      return false;
    }
    if (/^https?:\/\//i.test(u) || u.startsWith('//')) {
      return true;
    }
    return u.startsWith('/');
  }

  private applyDefaultHeroBanner(): void {
    this.heroImagePath = 'assets/images/bg_hero.jpg';
    this.showHeroText = true;
    this.heroBannerReady = true;
  }

  loadActivePromotions() {
    // Llamar al endpoint público sin headers de autenticación
    this.campaingService.getCampaingPublic().subscribe({
      next: (response) => {
        if (response.status === 200 && response.data && response.data.campaigns) {
          const promotionImages: string[] = [];
          
          // Recorrer todas las campañas activas
          response.data.campaigns.forEach((campaign: any) => {
            // Recorrer todas las promociones de cada campaña
            if (campaign.promotions && Array.isArray(campaign.promotions)) {
              campaign.promotions.forEach((promotion: any) => {
                // Intentar diferentes campos posibles para la URL de la imagen
                const imageUrl = promotion.promo_Path || promotion.path || promotion.image_path || '';
                
                if (imageUrl && imageUrl.trim() !== '') {
                  promotionImages.push(imageUrl.trim());
                }
              });
            }
          });
          
          this.activePromotionImages = promotionImages;
          
          // Si ya se cargaron vehículos, reinsertar banners con las promociones
          if (this.vehicles.length > 0) {
            const vehicleItems = this.vehicles.filter((i: any) => this.isVehicle(i)) as Vehicle[];
            if (vehicleItems.length > 0) {
              if (this.activePromotionImages.length > 0) {
                this.vehicles = this.insertBannersRandomly(vehicleItems, this.activePromotionImages);
                // Comentado: ya no filtra en el Showroom
                // this.filteredVehicles = [...this.vehicles];
              }
            }
          } else {
            // Si los vehículos aún no se han cargado, cargarlos ahora que las promociones están listas
            this.loadVehicles();
          }
        } else {
          // Si no hay promociones, cargar vehículos de todas formas
          if (this.vehicles.length === 0) {
            this.loadVehicles();
          }
        }
      },
      error: (error) => {
        this.activePromotionImages = [];
        // Si hay error, cargar vehículos de todas formas
        if (this.vehicles.length === 0) {
          this.loadVehicles();
        }
      }
    });
  }

  loadVehicles() {
    this.isLoading = true;
    this.loadError = '';

    // Cargar 10 vehículos desde la API (el 11vo será el banner)
    this.vehicleService.searchVehicles({}, 1, 10).subscribe({
      next: (response) => {
        if (response.status === 200 && response.data && response.data.data) {
          const apiVehicles = response.data.data;
          
          // Guardar el total de vehículos disponibles
          this.totalVehicles = response.data.total || 0;
          
          // Convertir vehículos de la API al formato del componente
          const mappedVehicles: Vehicle[] = apiVehicles.map((v) => {
            const imageUrl = v.first_image?.service_image_url || v.images?.[0]?.service_image_url || '';
            
        return {
          uuid: v.uuid,
          brand: (v.brand?.name || 'Sin marca').toUpperCase(),
          model: this.capitalizeFirst(v.model?.name || v.line?.name || 'Sin modelo'),
          year: v.model?.year || new Date().getFullYear(),
          price: v.sale_price || v.list_price || 0,
          mileage: v.mileage || 0,
          fuel: v.fuel_type || 'Gasolina',
          transmission: this.formatTransmission(v.transmission),
          status: 'active',
          image_url: imageUrl,
          name: v.name,
          apiData: v
        };
          });

          // Insertar banners con promociones activas o banner por defecto
          let vehiclesWithBanners: (Vehicle | { type: 'banner'; imageUrl?: string })[];
          
          if (this.activePromotionImages.length > 0) {
            // Insertar 2 banners aleatoriamente con promociones activas seleccionadas aleatoriamente
            vehiclesWithBanners = this.insertBannersRandomly(mappedVehicles, this.activePromotionImages);
          } else {
            // Insertar banner por defecto después de 3 vehículos
            vehiclesWithBanners = [
              ...mappedVehicles.slice(0, 3),
              { type: 'banner' },
              ...mappedVehicles.slice(3)
            ];
          }

          this.vehicles = vehiclesWithBanners;
          // Comentado: ya no filtra en el Showroom
          // this.filteredVehicles = [...this.vehicles];
        } else {
          this.loadFallbackVehicles();
        }
        this.isLoading = false;
      },
      error: (error) => {
        // Mensaje de error más descriptivo
        if (error.status === 0) {
          this.loadError = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
        } else if (error.status === 404) {
          this.loadError = 'El endpoint no fue encontrado. Verifica que el servidor esté corriendo.';
        } else if (error.status >= 500) {
          this.loadError = 'Error del servidor. Por favor, intenta de nuevo más tarde.';
        } else {
          this.loadError = `Error al cargar los vehículos (${error.status}). Por favor, intenta de nuevo.`;
        }
        
        this.isLoading = false;
        
        // Mantener datos de ejemplo en caso de error
        this.loadFallbackVehicles();
      }
    });
  }

  loadFallbackVehicles() {
    // Vehículos de ejemplo en caso de error de conexión
    this.vehicles = [
      { uuid: '1', brand: 'Chevrolet', model: 'Trax LT', year: 2020, price: 300000, mileage: 63626, fuel: 'Gasolina', transmission: 'Automático', status: 'active' },
      { uuid: '2', brand: 'Honda', model: 'Civic', year: 2021, price: 420000, mileage: 28500, fuel: 'Gasolina', transmission: 'Manual', status: 'active' },
      { uuid: '3', brand: 'Toyota', model: 'Camry', year: 2023, price: 650000, mileage: 12000, fuel: 'Híbrido', transmission: 'Automático', status: 'active' },
      { type: 'banner' },
      { uuid: '4', brand: 'Nissan', model: 'Versa', year: 2022, price: 280000, mileage: 15000, fuel: 'Gasolina', transmission: 'Automático', status: 'active' }
    ];
    // Comentado: ya no filtra en el Showroom
    // this.filteredVehicles = [...this.vehicles];
  }

  formatTransmission(transmission: string): string {
    const transmissionMap: { [key: string]: string } = {
      'automatico': 'Automático',
      'manual': 'Manual',
      'cvt': 'CVT',
      'triptronic': 'Triptronic'
    };
    return transmissionMap[transmission?.toLowerCase()] || transmission || 'Automático';
  }

  capitalizeFirst(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  // Métodos de búsqueda y filtrado
  onSearchChange() {
    // Comentado: ya no filtra en el Showroom
    // this.applyFilters();
  }

  toggleQuickFilter(filterKey: string) {
    const index = this.activeFilters.indexOf(filterKey);
    if (index > -1) {
      this.activeFilters.splice(index, 1);
    } else {
      this.activeFilters.push(filterKey);
    }
    // Comentado: ya no filtra en el Showroom
    // this.applyFilters();
  }

  isVehicle(item: any): item is Vehicle {
    return item && (item as Vehicle).brand !== undefined;
  }

  isBanner(item: any): item is { type: 'banner'; imageUrl?: string } {
    return item && item.type === 'banner';
  }

  getVehicleCount(): number {
    // Comentado: ya no filtra en el Showroom, usar vehicles directamente
    return this.vehicles.filter(v => !this.isBanner(v)).length;
  }

  getBannerImageUrl(item: any): string {
    if (this.isBanner(item)) {
      if (item.imageUrl) {
        return item.imageUrl;
      }
    }
    return FALLBACK_HERO_IMAGE;
  }

  onBannerImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = FALLBACK_HERO_IMAGE;
    }
  }

  insertBannersRandomly(vehicles: Vehicle[], promotionImages: string[]): (Vehicle | { type: 'banner'; imageUrl?: string })[] {
    if (promotionImages.length === 0 || vehicles.length === 0) {
      return vehicles;
    }

    // Siempre mostrar exactamente 2 banners con promociones aleatorias
    const numBanners = 2;
    const numVehicles = vehicles.length;
    
    // Seleccionar 2 promociones aleatorias del conjunto total
    let selectedPromotions: string[] = [];
    if (promotionImages.length === 1) {
      // Si solo hay 1 promoción, repetirla 2 veces
      selectedPromotions = [promotionImages[0], promotionImages[0]];
    } else if (promotionImages.length === 2) {
      // Si hay 2 promociones, usar ambas
      selectedPromotions = [...promotionImages];
    } else {
      // Si hay más de 2 promociones, seleccionar 2 aleatoriamente
      const shuffled = [...promotionImages].sort(() => Math.random() - 0.5);
      selectedPromotions = shuffled.slice(0, 2);
    }
    
    // Crear array de posiciones posibles (índices donde se pueden insertar banners)
    // Posiciones: 1, 2, 3, ..., numVehicles (después de cada vehículo)
    const possiblePositions: number[] = [];
    for (let i = 1; i <= numVehicles; i++) {
      possiblePositions.push(i);
    }

    // Seleccionar posiciones aleatorias para los banners (sin consecutivos)
    const selectedPositions: number[] = [];
    let attempts = 0;
    const maxAttempts = 1000;

    while (selectedPositions.length < numBanners && attempts < maxAttempts) {
      const randomIndex = Math.floor(Math.random() * possiblePositions.length);
      const position = possiblePositions[randomIndex];
      
      // Verificar que no sea consecutivo con ninguna posición ya seleccionada
      const isConsecutive = selectedPositions.some(selectedPos => 
        Math.abs(selectedPos - position) <= 1
      );
      
      if (!selectedPositions.includes(position) && !isConsecutive) {
        selectedPositions.push(position);
      }
      
      attempts++;
    }

    // Ordenar posiciones para insertar de forma secuencial
    selectedPositions.sort((a, b) => a - b);

    // Si no pudimos colocar todos los banners, usar las posiciones que sí funcionaron
    let validPositions = selectedPositions.length > 0 ? selectedPositions : [];
    
    // Asegurar que siempre tengamos 2 posiciones para los 2 banners
    if (validPositions.length === 0 && numVehicles > 0) {
      // Caso extremo: insertar después del primer y último vehículo
      validPositions = [1, numVehicles];
    } else if (validPositions.length === 1) {
      // Si solo encontramos 1 posición, agregar otra que no sea consecutiva
      const firstPos = validPositions[0];
      const secondPos = firstPos >= numVehicles - 1 ? 1 : numVehicles;
      validPositions.push(secondPos);
      validPositions.sort((a, b) => a - b);
    }

    // Construir el array final insertando vehículos y banners
    const result: (Vehicle | { type: 'banner'; imageUrl?: string })[] = [];
    let bannerIndex = 0;

    for (let i = 0; i < numVehicles; i++) {
      // Insertar vehículo
      result.push(vehicles[i]);
      
      // Insertar banner si esta posición (después del vehículo i) está seleccionada
      if (validPositions.includes(i + 1) && bannerIndex < selectedPromotions.length) {
        result.push({
          type: 'banner',
          imageUrl: selectedPromotions[bannerIndex]
        });
        bannerIndex++;
      }
    }

    return result;
  }

  // Comentado: ya no filtra en el Showroom
  /*
  applyFilters() {
    // 1) Separar vehículos y banners (preservar banners con sus imágenes)
    const banners: { type: 'banner'; imageUrl?: string }[] = this.vehicles.filter((i: any) => this.isBanner(i)) as { type: 'banner'; imageUrl?: string }[];
    const vehicleItems: Vehicle[] = (this.vehicles.filter((i: any) => this.isVehicle(i)) as Vehicle[]);

    // 2) Preparar helpers de coincidencia
    const normalizedSearch = (this.searchTerm || '').toString().trim().toLowerCase();
    const normalizedLocation = (this.searchLocation || '').toString().trim().toLowerCase();

    // Parseo de precio máximo seleccionado (tratar como tope <=)
    const priceCap = this.selectedPriceRange ? Number(this.selectedPriceRange) : NaN;

    // 3) Aplicar filtros
    const filteredVehicles: Vehicle[] = vehicleItems.filter((item: Vehicle) => {
      const brand = (item.brand || '').toString();
      const model = (item.model || '').toString();
      const fuel = (item.fuel || '').toString();
      const name = (item.name || '').toString();

      // Marca y modelo
      const matchesBrand = !this.selectedBrand || brand === this.selectedBrand;
      const matchesModel = !this.selectedModel || model === this.selectedModel;

      // Precio (tope máximo)
      const matchesPrice = !this.selectedPriceRange || (Number.isFinite(priceCap) && item.price <= priceCap);

      // Búsqueda por texto en uuid, vin, brand, model, year, name
      const uuid = (item.uuid || '').toString().toLowerCase();
      const vin = (item.apiData?.vin || '').toString().toLowerCase();
      const textHaystack = `${uuid} ${vin} ${brand} ${model} ${item.year} ${name}`.toLowerCase();
      const matchesSearch = !normalizedSearch || textHaystack.includes(normalizedSearch);

      // Ubicación (si hay datos de API)
      const apiDealershipName = (item.apiData as any)?.dealership?.name || '';
      const apiDealershipLocation = (item.apiData as any)?.dealership?.location || '';
      const locationHaystack = `${apiDealershipName} ${apiDealershipLocation}`.toLowerCase();
      const matchesLocation = !normalizedLocation || locationHaystack.includes(normalizedLocation);

      // Quick filters
      const quicks = this.activeFilters || [];
      const matchesQuick = quicks.length === 0 || quicks.every((q) => {
        switch (q) {
          case 'premium':
            return (item.status || '').toLowerCase() === 'premium';
          case 'eco':
            return fuel.toLowerCase().includes('híbrido') || fuel.toLowerCase().includes('hibrido') || fuel.toLowerCase().includes('eléctrico') || fuel.toLowerCase().includes('electrico');
          case 'low-mileage':
            return (item.mileage || 0) < 50000;
          case 'recent':
            return (item.year || 0) >= new Date().getFullYear() - 2;
          default:
            return true;
        }
      });

      return matchesBrand && matchesModel && matchesPrice && matchesSearch && matchesLocation && matchesQuick;
    });

    // 4) Aplicar ordenamiento sobre vehículos filtrados
    this.sortVehicles(filteredVehicles);

    // 5) Reinsertar banners aleatoriamente si hay promociones activas, o banner por defecto
    let rebuilt: (Vehicle | { type: 'banner'; imageUrl?: string })[];
    
    if (this.activePromotionImages.length > 0) {
      // Reinsertar 2 banners aleatoriamente con promociones seleccionadas aleatoriamente
      rebuilt = this.insertBannersRandomly(filteredVehicles, this.activePromotionImages);
    } else if (banners.length > 0) {
      // Si hay banners pero no promociones activas, insertar banner por defecto después de 3 vehículos
      rebuilt = [
        ...filteredVehicles.slice(0, 3),
        { type: 'banner' },
        ...filteredVehicles.slice(3)
      ];
    } else {
      // Sin banners
      rebuilt = [...filteredVehicles];
    }

    this.filteredVehicles = rebuilt;
  }
  */

  sortVehicles(vehicles: Vehicle[]) {
    vehicles.sort((a, b) => {
      switch (this.sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'newest':
        default: return b.year - a.year;
      }
    });
  }

  onSortChange() {
    // Comentado: ya no filtra en el Showroom
    // this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.activeFilters = [];
    this.selectedBrand = '';
    this.selectedModel = '';
    this.inventoryModelNames = [];
    this.selectedPriceRange = '';
    this.searchLocation = '';
    this.loadInventoryLocations();
    this.selectedCategory = 'all';
    // Comentado: ya no filtra en el Showroom
    // this.applyFilters();
  }

  // Métodos de navegación
  viewVehicleDetail(vehicle: Vehicle) {
    this.router.navigate(['/vehiculo', vehicle.uuid]);
  }

  contactVehicle(vehicle: Vehicle) {
    const contado = vehicle.price;
    const mensual = this.getMonthlyPayment(vehicle.price);
    const downPayment = Math.round(vehicle.price * 0.10);
    const message = `Hola, estoy interesado en el ${vehicle.brand} ${vehicle.model} ${vehicle.year}. 
    
💰 Venta de Contado: $${contado.toLocaleString()} MXN
📅 Financiamiento: $${mensual.toLocaleString()} MXN/mes (60 mensualidades)
📊 Enganche: $${downPayment.toLocaleString()} MXN (10%)

¿Podrían darme más información?`;
    const whatsappUrl = `https://wa.me/5217771234567?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  // Métodos de categorías
  selectCategory(category: string) {
    this.selectedCategory = category;
    // Comentado: ya no filtra en el Showroom
    // this.applyFilters();
  }

  getAvailableModels(): string[] {
    return this.inventoryModelNames;
  }

  onHomeBrandChange(): void {
    this.selectedModel = '';
    this.inventoryModelNames = [];
    this.loadInventoryLocations();
    if (!this.selectedBrand) {
      return;
    }
    this.vehicleService.getModelsByBrand(this.selectedBrand).subscribe({
      next: (res) => {
        const list = res?.data?.line_models || [];
        const names = list
          .map((m: { name: string }) => (m.name || '').trim())
          .filter(Boolean);
        this.inventoryModelNames = Array.from(new Set(names)).sort((a, b) =>
          a.localeCompare(b, 'es', { sensitivity: 'base' })
        );
      },
      error: () => {
        this.inventoryModelNames = [];
      }
    });
  }

  /** Al cambiar modelo o precio, actualizar ubicaciones según vehículos que cumplan filtros */
  onHomeLocationFiltersChange(): void {
    this.loadInventoryLocations();
  }

  /** Autos/motos: al menos uno activo; actualiza opciones de ubicación. */
  onHomeVehicleTypesChange(): void {
    if (!this.includeVehicleAuto && !this.includeVehicleMoto) {
      this.includeVehicleAuto = true;
      this.includeVehicleMoto = true;
    }
    this.loadInventoryLocations();
  }

  /**
   * Filtros de inventario alineados con `VehicleService.searchVehicles` para poblar ubicaciones.
   */
  private buildHomeSearchFiltersForLocations(): Record<string, string | number> {
    const f: Record<string, string | number> = {};
    if (this.selectedBrand) {
      f['brand'] = this.selectedBrand;
    }
    if (this.selectedModel) {
      f['model'] = this.selectedModel;
    }
    if (this.selectedPriceRange) {
      if (this.selectedPriceRange === '2000000') {
        f['priceFrom'] = 2000000;
      } else {
        const cap = Number(this.selectedPriceRange);
        if (!Number.isNaN(cap) && cap > 0) {
          f['priceTo'] = cap;
        }
      }
    }
    return f;
  }

  private mergeDealershipLocationsFromVehicles(
    vehicles: ApiVehicle[],
    into: Map<string, string>
  ): void {
    for (const v of vehicles) {
      const d = v.dealership;
      // Muchas sucursales tienen `location` vacío en BD; el inventario público usa a menudo el nombre.
      const label = (d?.location?.trim() || d?.name?.trim() || '').trim();
      if (!label) {
        continue;
      }
      const key = label.toLowerCase();
      if (!into.has(key)) {
        into.set(key, label);
      }
    }
  }

  loadInventoryLocations(): void {
    const seq = ++this.locationsRequestSeq;
    this.loadingLocations = true;
    const filters: Record<string, unknown> = {
      ...this.buildHomeSearchFiltersForLocations(),
      has_images: false
    };
    const vt = resolveVehicleTypesFilter(this.includeVehicleAuto, this.includeVehicleMoto);
    if (vt?.length) {
      filters['vehicleTypes'] = vt;
    }
    const acc = new Map<string, string>();
    /** Con marca/modelo/precio solo tienen sentido ciudades donde hay stock que cumple el filtro. */
    const hasInventoryFilters = !!(
      this.selectedBrand ||
      this.selectedModel ||
      this.selectedPriceRange
    );

    const finish = () => {
      if (seq !== this.locationsRequestSeq) {
        return;
      }
      this.applyLocationOptionsFromMap(acc);
    };

    const mergeDealershipApiRows = (rows: { location?: string; name?: string }[]) => {
      for (const d of rows) {
        const label = (d?.location?.trim() || d?.name?.trim() || '').trim();
        if (!label) {
          continue;
        }
        const key = label.toLowerCase();
        if (!acc.has(key)) {
          acc.set(key, label);
        }
      }
    };

    const fetchPage = (page: number) => {
      this.vehicleService.searchVehicles(filters, page, this.locationsPageSize).subscribe({
        next: (response) => {
          if (seq !== this.locationsRequestSeq) {
            return;
          }
          if (response.status === 200 && response.data) {
            const rows = response.data.data || [];
            this.mergeDealershipLocationsFromVehicles(rows, acc);
            const lastPage = response.data.last_page ?? 1;
            if (page < lastPage && page < this.locationsMaxPages) {
              fetchPage(page + 1);
              return;
            }
          }
          finish();
        },
        error: () => finish()
      });
    };

    if (!hasInventoryFilters) {
      this.vehicleService.searchDealerships().subscribe({
        next: (res) => {
          if (seq !== this.locationsRequestSeq) {
            return;
          }
          const list = res?.data ?? [];
          mergeDealershipApiRows(Array.isArray(list) ? list : []);
          fetchPage(1);
        },
        error: () => {
          if (seq !== this.locationsRequestSeq) {
            return;
          }
          fetchPage(1);
        }
      });
    } else {
      fetchPage(1);
    }
  }

  private applyLocationOptionsFromMap(acc: Map<string, string>): void {
    this.inventoryLocationOptions = Array.from(acc.values()).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );
    this.loadingLocations = false;
    const sel = (this.searchLocation || '').trim();
    if (sel && !this.inventoryLocationOptions.some((x) => x.toLowerCase() === sel.toLowerCase())) {
      this.searchLocation = '';
    }
  }

  loadInventoryBrands(): void {
    this.vehicleService.getBrands().subscribe({
      next: (res) => {
        const list = res?.data?.vehicle_brands || [];
        this.inventoryBrands = [...list].sort((a, b) =>
          (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' })
        );
      },
      error: () => {
        this.inventoryBrands = [];
      }
    });
  }

  // Métodos de servicios
  toggleService(index: number) {
    this.abcarsServices[index].isOpen = !this.abcarsServices[index].isOpen;
  }

  // Métodos helper
  getMonthlyPayment(price: number): number {
    // Parámetros de financiamiento
    const downPaymentPercentage = 10; // 10% de enganche
    const annualInterestRate = 15; // 15% anual
    const termMonths = 60; // 60 meses
    
    // Calcular monto a financiar
    const downPayment = (price * downPaymentPercentage) / 100;
    const principal = price - downPayment;
    
    // Tasa de interés mensual
    const monthlyRate = annualInterestRate / 100 / 12;
    
    // Fórmula de amortización
    if (monthlyRate === 0) {
      return Math.round(principal / termMonths);
    }
    
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
      (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    return Math.round(monthlyPayment);
  }

  performSearch() {
    const queryParams: Record<string, string> = {};

    const vt = resolveVehicleTypesFilter(this.includeVehicleAuto, this.includeVehicleMoto);
    if (vt?.length) {
      if (this.includeVehicleMoto && !this.includeVehicleAuto) {
        queryParams['vt'] = 'moto';
      } else if (this.includeVehicleAuto && !this.includeVehicleMoto) {
        queryParams['vt'] = 'auto';
      }
    }

    if (this.selectedBrand) {
      queryParams['brand'] = this.selectedBrand;
    }
    if (this.selectedModel) {
      queryParams['model'] = this.selectedModel;
    }
    if (this.selectedPriceRange) {
      queryParams['price'] = this.selectedPriceRange;
    }
    if (this.searchLocation.trim()) {
      queryParams['location'] = this.searchLocation.trim();
    }
    if (this.searchTerm.trim()) {
      queryParams['search'] = this.searchTerm.trim();
    }

    this.router.navigate(['/inventario'], { queryParams });
  }

  scrollToResults() {
    const resultsSection = document.querySelector('#vehiculos');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
} 