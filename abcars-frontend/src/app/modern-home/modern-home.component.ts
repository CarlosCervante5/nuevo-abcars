import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { VehicleCardComponent } from './vehicle-card/vehicle-card.component';
import { HomeNavComponent } from '../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../shared/components/modern-footer/modern-footer.component';
import { VehicleService } from '../shared/services/vehicle.service';
import { CampaingService } from '../shared/services/campaing.service';
import { Vehicle as ApiVehicle } from '../shared/interfaces/vehicle_data.interface';

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
  imports: [CommonModule, FormsModule, VehicleCardComponent, HomeNavComponent, ModernFooterComponent],
  templateUrl: './modern-home.component.html',
  styleUrls: ['./modern-home.component.css'],
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
export class ModernHomeComponent implements OnInit {
  
  // Propiedades de búsqueda
  searchTerm: string = '';
  selectedCategory: string = 'all';
  selectedBrand: string = '';
  selectedModel: string = '';
  selectedPriceRange: string = '';
  searchLocation: string = '';
  sortBy: string = 'newest';
  activeFilters: string[] = [];
  
  // Datos de vehículos
  vehicles: (Vehicle | { type: 'banner'; imageUrl?: string })[] = [];
  filteredVehicles: (Vehicle | { type: 'banner'; imageUrl?: string })[] = [];
  isLoading: boolean = true;
  loadError: string = '';
  activePromotionImages: string[] = [];

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
      question: 'Compramos tu auto',
      answer: 'Realizamos la compra de tu vehículo actual al mejor precio del mercado. Evaluamos tu auto de forma gratuita y te ofrecemos una cotización competitiva en el momento.',
      isOpen: false
    },
    {
      question: 'Financiamiento',
      answer: 'Ofrecemos las mejores opciones de financiamiento automotriz con tasas preferenciales. Créditos flexibles adaptados a tu capacidad de pago con plazos de hasta 72 meses.',
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

  constructor(
    private router: Router,
    private vehicleService: VehicleService,
    private campaingService: CampaingService
  ) {}

  ngOnInit() {
    // Cargar promociones primero, los vehículos se cargarán cuando las promociones estén listas
    this.loadActivePromotions();
  }

  loadActivePromotions() {
    // Llamar al endpoint público sin headers de autenticación
    this.campaingService.getCampaingPublic().subscribe({
      next: (response) => {
        console.log('📦 [PROMO] Respuesta completa de promociones:', response);
        
        if (response.status === 200 && response.data && response.data.campaigns) {
          const promotionImages: string[] = [];
          
          console.log('📋 [PROMO] Total de campañas recibidas:', response.data.campaigns.length);
          
          // Recorrer todas las campañas activas
          response.data.campaigns.forEach((campaign: any, campaignIndex: number) => {
            console.log(`📋 [PROMO] Campaña ${campaignIndex + 1}:`, {
              uuid: campaign.uuid,
              name: campaign.name,
              promotions_count: campaign.promotions?.length || 0,
              promotions: campaign.promotions
            });
            
            // Recorrer todas las promociones de cada campaña
            if (campaign.promotions && Array.isArray(campaign.promotions)) {
              campaign.promotions.forEach((promotion: any, promoIndex: number) => {
                console.log(`  📸 [PROMO] Promoción ${promoIndex + 1}:`, {
                  promo_Path: promotion.promo_Path,
                  path: promotion.path,
                  id: promotion.id,
                  full_object: promotion
                });
                
                // Intentar diferentes campos posibles para la URL de la imagen
                const imageUrl = promotion.promo_Path || promotion.path || promotion.image_path || '';
                
                if (imageUrl && imageUrl.trim() !== '') {
                  promotionImages.push(imageUrl.trim());
                  console.log(`  ✅ [PROMO] Imagen agregada: ${imageUrl.trim()}`);
                } else {
                  console.log(`  ⚠️ [PROMO] Promoción sin URL de imagen válida`);
                }
              });
            } else {
              console.log(`  ⚠️ [PROMO] Campaña sin promociones o promociones no es array`);
            }
          });
          
          this.activePromotionImages = promotionImages;
          console.log('✅ [PROMO] Promociones activas cargadas:', this.activePromotionImages.length, 'imágenes');
          console.log('📋 [PROMO] URLs de imágenes:', this.activePromotionImages);
          
          // Si ya se cargaron vehículos, reinsertar banners con las promociones
          if (this.vehicles.length > 0) {
            const vehicleItems = this.vehicles.filter((i: any) => this.isVehicle(i)) as Vehicle[];
            if (vehicleItems.length > 0) {
              if (this.activePromotionImages.length > 0) {
                this.vehicles = this.insertBannersRandomly(vehicleItems, this.activePromotionImages);
                this.filteredVehicles = [...this.vehicles];
                console.log('✅ [PROMO] Banners actualizados con promociones');
              }
            }
          } else {
            // Si los vehículos aún no se han cargado, cargarlos ahora que las promociones están listas
            this.loadVehicles();
          }
        } else {
          console.warn('⚠️ [PROMO] Respuesta sin estructura esperada:', response);
          // Si no hay promociones, cargar vehículos de todas formas
          if (this.vehicles.length === 0) {
            this.loadVehicles();
          }
        }
      },
      error: (error) => {
        console.error('❌ [PROMO] Error al cargar promociones activas:', error);
        this.activePromotionImages = [];
        // Si hay error, cargar vehículos de todas formas
        if (this.vehicles.length === 0) {
          this.loadVehicles();
        }
      }
    });
  }

  loadVehicles() {
    console.log('🚀 [HOME] Iniciando carga de vehículos desde la API...');
    this.isLoading = true;
    this.loadError = '';

    // Cargar 7 vehículos desde la API (el 8vo será el banner)
    this.vehicleService.searchVehicles({}, 1, 7).subscribe({
      next: (response) => {
        console.log('📦 [HOME] Respuesta de la API recibida:', response);
        
        if (response.status === 200 && response.data && response.data.data) {
          const apiVehicles = response.data.data;
          console.log(`✅ [HOME] ${apiVehicles.length} vehículos recibidos de la API`);
          
          // Convertir vehículos de la API al formato del componente
          const mappedVehicles: Vehicle[] = apiVehicles.map((v, index) => {
            const imageUrl = v.first_image?.service_image_url || v.images?.[0]?.service_image_url || '';
            console.log(`🖼️ [HOME] Vehículo ${index + 1} (${v.brand?.name} ${v.model?.name}):`, {
              uuid: v.uuid,
              first_image: v.first_image?.service_image_url,
              images_count: v.images?.length || 0,
              final_image_url: imageUrl
            });
            
        return {
          uuid: v.uuid,
          brand: this.capitalizeFirst(v.brand?.name || 'Sin marca'),
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

          console.log('🔄 [HOME] Vehículos mapeados:', mappedVehicles.length);
          console.log('📋 [HOME] Promociones activas disponibles:', this.activePromotionImages.length);
          console.log('📋 [HOME] URLs de promociones:', this.activePromotionImages);

          // Insertar banners con promociones activas o banner por defecto
          let vehiclesWithBanners: (Vehicle | { type: 'banner'; imageUrl?: string })[];
          
          if (this.activePromotionImages.length > 0) {
            // Insertar 2 banners aleatoriamente con promociones activas seleccionadas aleatoriamente
            vehiclesWithBanners = this.insertBannersRandomly(mappedVehicles, this.activePromotionImages);
            console.log('✅ [HOME] 2 banners de promociones insertados aleatoriamente');
            console.log('📋 [HOME] Banners insertados:', vehiclesWithBanners.filter((i: any) => this.isBanner(i)));
          } else {
            // Insertar banner por defecto después de 3 vehículos
            vehiclesWithBanners = [
              ...mappedVehicles.slice(0, 3),
              { type: 'banner' },
              ...mappedVehicles.slice(3)
            ];
            console.log('✅ [HOME] Banner por defecto insertado (sin promociones activas)');
          }

          this.vehicles = vehiclesWithBanners;
          this.filteredVehicles = [...this.vehicles];
          console.log('✅ [HOME] Vehículos cargados exitosamente. Total con banner:', this.vehicles.length);
          console.log('📋 [HOME] filteredVehicles:', this.filteredVehicles);
          console.log('🔍 [HOME] Primer vehículo:', this.filteredVehicles[0]);
        } else {
          console.warn('⚠️ [HOME] Respuesta de la API sin datos esperados:', response);
          this.loadFallbackVehicles();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ [HOME] Error al cargar vehículos:', error);
        console.error('❌ [HOME] Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        this.loadError = 'Error al cargar los vehículos. Por favor, intenta de nuevo más tarde.';
        this.isLoading = false;
        
        // Mantener datos de ejemplo en caso de error
        console.log('🔄 [HOME] Cargando vehículos de respaldo...');
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
    this.filteredVehicles = [...this.vehicles];
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
    this.applyFilters();
  }

  toggleQuickFilter(filterKey: string) {
    const index = this.activeFilters.indexOf(filterKey);
    if (index > -1) {
      this.activeFilters.splice(index, 1);
    } else {
      this.activeFilters.push(filterKey);
    }
    this.applyFilters();
  }

  isVehicle(item: any): item is Vehicle {
    return item && (item as Vehicle).brand !== undefined;
  }

  isBanner(item: any): item is { type: 'banner'; imageUrl?: string } {
    return item && item.type === 'banner';
  }

  getBannerImageUrl(item: any): string {
    if (this.isBanner(item)) {
      if (item.imageUrl) {
        console.log('🖼️ [BANNER] Usando imagen de promoción:', item.imageUrl);
        return item.imageUrl;
      } else {
        console.log('🖼️ [BANNER] Banner sin imageUrl, usando imagen por defecto');
      }
    }
    return 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=600&q=80';
  }

  onBannerImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=600&q=80';
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
    
    console.log('🎲 [BANNER] Promociones seleccionadas aleatoriamente:', selectedPromotions);
    
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
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.activeFilters = [];
    this.selectedBrand = '';
    this.selectedModel = '';
    this.selectedPriceRange = '';
    this.searchLocation = '';
    this.selectedCategory = 'all';
    this.applyFilters();
  }

  // Métodos de navegación
  viewVehicleDetail(vehicle: Vehicle) {
    console.log('Navegando a detalles del vehículo:', vehicle);
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
    this.applyFilters();
  }

  getAvailableModels(): string[] {
    const models = this.vehicles
      .filter(this.isVehicle)
      .filter((v: any) => !this.selectedBrand || (v as Vehicle).brand === this.selectedBrand)
      .map((v: any) => (v as Vehicle).model)
      .filter(Boolean) as string[];

    return Array.from(new Set(models));
  }

  getAvailableBrands(): string[] {
    const brands = this.vehicles
      .filter(this.isVehicle)
      .map((v: any) => (v as Vehicle).brand)
      .filter(Boolean) as string[];
    return Array.from(new Set(brands));
  }

  // Métodos de servicios
  toggleService(index: number) {
    this.abcarsServices[index].isOpen = !this.abcarsServices[index].isOpen;
  }

  // Métodos helper
  getMonthlyPayment(price: number): number {
    // Parámetros de financiamiento
    const downPaymentPercentage = 10; // 10% de enganche
    const annualInterestRate = 12.5; // 12.5% anual
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
    this.applyFilters();
    this.scrollToResults();
  }

  scrollToResults() {
    const resultsSection = document.querySelector('#vehiculos');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
} 