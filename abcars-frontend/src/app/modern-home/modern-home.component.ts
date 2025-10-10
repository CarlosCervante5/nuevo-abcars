import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VehicleCardComponent } from './vehicle-card/vehicle-card.component';
import { HomeNavComponent } from '../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../shared/components/modern-footer/modern-footer.component';
import { VehicleService } from '../shared/services/vehicle.service';
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
  styleUrls: ['./modern-home.component.css']
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
  vehicles: (Vehicle | { type: 'banner' })[] = [];
  filteredVehicles: (Vehicle | { type: 'banner' })[] = [];
  isLoading: boolean = true;
  loadError: string = '';

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
    private vehicleService: VehicleService
  ) {}

  ngOnInit() {
    this.loadVehicles();
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

          // Insertar banner en la posición 4 (después de 3 vehículos)
          const vehiclesWithBanner: (Vehicle | { type: 'banner' })[] = [
            ...mappedVehicles.slice(0, 3),
            { type: 'banner' },
            ...mappedVehicles.slice(3)
          ];

          this.vehicles = vehiclesWithBanner;
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

  isBanner(item: any): item is { type: 'banner' } {
    return item && item.type === 'banner';
  }

  applyFilters() {
    // Filtrado solo para vehículos, los banners se mantienen en su posición
    const filtered = this.vehicles.filter((item: any) => {
      if (item.type === 'banner') return true;
      if (!this.isVehicle(item)) return false;
      return (
        (!this.selectedBrand || item.brand === this.selectedBrand) &&
        (!this.selectedModel || item.model === this.selectedModel)
      );
    });
    this.filteredVehicles = filtered;
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
    const contado = Math.round(vehicle.price * 0.95);
    const mensual = this.getMonthlyPayment(vehicle.price);
    const message = `Hola, estoy interesado en el ${vehicle.brand} ${vehicle.model} ${vehicle.year}. 
    
💰 Venta de Contado: $${contado.toLocaleString()} MXN (5% descuento)
📅 Financiamiento: $${mensual.toLocaleString()} MXN/mes (48 mensualidades)

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
    return this.vehicles
      .filter(this.isVehicle)
      .filter(v => !this.selectedBrand || v.brand === this.selectedBrand)
      .map(v => v.model)
      .filter((value, index, self) => self.indexOf(value) === index);
  }

  getAvailableBrands(): string[] {
    return this.vehicles.filter(this.isVehicle).map(v => v.brand);
  }

  // Métodos de servicios
  toggleService(index: number) {
    this.abcarsServices[index].isOpen = !this.abcarsServices[index].isOpen;
  }

  // Métodos helper
  getMonthlyPayment(price: number): number {
    return Math.round(price * 0.08);
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