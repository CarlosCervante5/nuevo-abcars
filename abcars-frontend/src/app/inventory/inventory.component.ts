import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VehicleCardTailwindComponent, Vehicle } from '../shared/components/vehicle-card-tailwind/vehicle-card-tailwind.component';
import { DarkNavComponent } from 'src/app/shared/components/dark-nav/dark-nav.component';
import { ModernFooterComponent } from 'src/app/shared/components/modern-footer/modern-footer.component';
import { BannerGenericComponent } from '../shared/components/banner-generic/banner-generic.component';
import { VehicleService } from '../shared/services/vehicle.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, RouterModule, VehicleCardTailwindComponent, DarkNavComponent, ModernFooterComponent, BannerGenericComponent],
  template: `
    <app-dark-nav></app-dark-nav>
    <div class="bg-gray-50">
      <main class="pt-24">
        <div class="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <!-- Barra de búsqueda superior -->
          <div class="mb-8">
            <div class="relative max-w-4xl mx-auto">
              <div class="relative">
                <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input 
                  type="text" 
                  placeholder="Busca por modelo, marca, año, características..."
                  class="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all bg-white shadow-sm"
                >
              </div>
            </div>
          </div>

          <!-- Contador de resultados y ordenamiento -->
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-900">{{ mixedItems.length }} Resultados</h1>
            <div class="flex items-center space-x-4">
              <span class="text-gray-600">Ordenar por:</span>
              <select class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500">
                <option>Más relevantes</option>
                <option>Precio: menor a mayor</option>
                <option>Precio: mayor a menor</option>
                <option>Año: más reciente</option>
                <option>Kilometraje: menor</option>
              </select>
            </div>
          </div>

          <div class="flex flex-col lg:flex-row gap-8">
            <!-- Barra lateral de Filtros mejorada -->
            <aside class="lg:w-1/4 xl:w-1/5">
              <div class="sticky top-28 space-y-6">
                
                <!-- Promoción superior -->
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div class="flex items-start space-x-3">
                    <div class="flex-1">
                      <h3 class="font-semibold text-blue-900 mb-2">Encuentra el auto ideal para tu presupuesto</h3>
                      <a href="#" class="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center">
                        Simular plan a meses
                        <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </a>
                    </div>
                    <div class="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                      <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Filtros principales -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div class="p-4 border-b border-gray-200">
                    <h2 class="text-lg font-bold text-gray-900">Filtros</h2>
                  </div>
                  
                  <!-- Filtro Precio -->
                  <div class="border-b border-gray-100">
                    <button class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Precio</span>
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    <div class="px-4 pb-4">
                      <div class="space-y-3">
                        <div class="flex items-center justify-between">
                          <span class="text-sm text-gray-600">Desde</span>
                          <span class="text-sm font-medium">$173,999</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="text-sm text-gray-600">Hasta</span>
                          <span class="text-sm font-medium">$2,000,000+</span>
                        </div>
                        <input type="range" min="0" max="2000000" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                      </div>
                    </div>
                  </div>

                  <!-- Filtro Ofertas -->
                  <div class="border-b border-gray-100">
                    <button class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Ofertas</span>
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                  </div>

                  <!-- Filtro Ubicación -->
                  <div class="border-b border-gray-100">
                    <button class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Ubicación</span>
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                  </div>

                  <!-- Filtro Marca -->
                  <div class="border-b border-gray-100">
                    <button class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Marca</span>
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                  </div>

                  <!-- Filtro Modelo -->
                  <div class="border-b border-gray-100">
                    <button class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Modelo</span>
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                  </div>

                  <!-- Filtro Año y Kilometraje -->
                  <div class="border-b border-gray-100">
                    <button class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Año y Kilometraje</span>
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                  </div>

                  <!-- Filtro Tipo de auto -->
                  <div class="border-b border-gray-100">
                    <button class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Tipo de auto</span>
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                  </div>

                  <!-- Filtro Mecánica -->
                  <div class="border-b border-gray-100">
                    <button class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Mecánica</span>
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                  </div>

                  <!-- Filtro Color exterior -->
                  <div class="border-b border-gray-100">
                    <button class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Color exterior</span>
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                </div>

                  <!-- Filtro Estado -->
                  <div class="border-b border-gray-100">
                    <button class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Estado</span>
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                   </div>
                </div>
                
                <!-- Botón aplicar filtros -->
                <button class="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
                  Aplicar Filtros
                </button>

              </div>
            </aside>

            <!-- Grid de Vehículos y Banners -->
            <div class="lg:w-3/4 xl:w-4/5">
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <ng-container *ngFor="let item of mixedItems">
                  <!-- Vehículo -->
                  <app-vehicle-card-tailwind *ngIf="isVehicle(item)" [vehicle]="item"></app-vehicle-card-tailwind>
                  
                  <!-- Banner de publicidad -->
                  <app-banner-generic *ngIf="isBanner(item)" 
                    [title]="item.title" 
                    [description]="item.description" 
                    [buttonText]="item.buttonText"
                    [imageUrl]="item.imageUrl">
                  </app-banner-generic>
                </ng-container>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    <app-modern-footer></app-modern-footer>
  `,
  styles: [
    `
    /* Custom scrollbar para la lista de marcas */
    .max-h-48::-webkit-scrollbar {
      width: 6px;
    }
    .max-h-48::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    .max-h-48::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 10px;
    }
    .max-h-48::-webkit-scrollbar-thumb:hover {
      background: #aaa;
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      background: #ffc73a; /* Naranja principal */
      cursor: pointer;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 5px rgba(0,0,0,0.2);
    }

    input[type="range"]::-moz-range-thumb {
      width: 20px;
      height: 20px;
      background: #ffc73a;
      cursor: pointer;
      border-radius: 50%;
      border: 2px solid white;
    }
    `
  ]
})
export class InventoryComponent implements OnInit {
  
  sampleVehicles: Vehicle[] = [];
  mixedItems: (Vehicle | { type: 'banner', title: string, description: string, buttonText: string, imageUrl: string })[] = [];
  
  brands: string[] = [];
  isLoading: boolean = true;
  loadError: string = '';

  constructor(private vehicleService: VehicleService) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.isLoading = true;
    this.loadError = '';

    this.vehicleService.searchVehicles({}, 1, 20).subscribe({
      next: (response) => {
        if (response.status === 200 && response.data && response.data.data) {
          // Mapear vehículos de la API para incluir el año desde model.year
          this.sampleVehicles = response.data.data.map(v => ({
            ...v,
            year: v.model?.year || new Date().getFullYear()
          }));
          this.createMixedItems();
          this.populateFilters();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar vehículos:', error);
        this.loadError = 'Error al cargar los vehículos';
        this.isLoading = false;
        this.loadFallbackVehicles();
      }
    });
  }

  loadFallbackVehicles(): void {
    this.sampleVehicles = [
      {
        uuid: '1',
        name: 'BMW X5 M Competition',
        sale_price: 1850000,
        mileage: 36035,
        exterior_color: 'Negro',
        year: 2021,
        brand: { name: 'BMW' },
        model: { name: 'X5 M', year: 2021 },
        first_image: { service_image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80' }
      },
      {
        uuid: '2',
        name: 'Mercedes-Benz C300 e AMG Line',
        sale_price: 890000,
        mileage: 64300,
        exterior_color: 'Gris',
        year: 2022,
        brand: { name: 'Mercedes-Benz' },
        model: { name: 'C300', year: 2022 },
        first_image: { service_image_url: 'https://images.unsplash.com/photo-1563694983011-6f4d90358083?auto=format&fit=crop&w=800&q=80' }
      },
      {
        uuid: '3',
        name: 'Porsche 911 GT3',
        sale_price: 2750000,
        mileage: 7900,
        exterior_color: 'Blanco',
        year: 2021,
        brand: { name: 'Porsche' },
        model: { name: '911 GT3', year: 2021 },
        first_image: { service_image_url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=80' }
      },
      {
        uuid: '4',
        name: 'Audi RS6 Avant quattro',
        sale_price: 1650000,
        mileage: 95600,
        exterior_color: 'Azul',
        year: 2020,
        brand: { name: 'Audi' },
        model: { name: 'RS6', year: 2020 },
        first_image: { service_image_url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=80' }
      },
       {
        uuid: '5',
        name: 'Chevrolet Trax LT',
        sale_price: 300000,
        mileage: 63626,
        exterior_color: 'Rojo',
        year: 2020,
        brand: { name: 'Chevrolet' },
        model: { name: 'Trax', year: 2020 },
        first_image: { service_image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80' }
      },
      {
        uuid: '6',
        name: 'Honda Civic Sport',
        sale_price: 420000,
        mileage: 28500,
        exterior_color: 'Gris',
        year: 2021,
        brand: { name: 'Honda' },
        model: { name: 'Civic', year: 2021 },
        first_image: { service_image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80' }
      },
       {
        uuid: '7',
        name: 'Toyota Camry Hybrid XLE',
        sale_price: 650000,
        mileage: 12000,
        exterior_color: 'Blanco',
        year: 2023,
        brand: { name: 'Toyota' },
        model: { name: 'Camry', year: 2023 },
        first_image: { service_image_url: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&w=800&q=80' }
      },
      {
        uuid: '8',
        name: 'Ford Mustang GT Premium',
        sale_price: 950000,
        mileage: 18500,
        exterior_color: 'Negro',
        year: 2022,
        brand: { name: 'Ford' },
        model: { name: 'Mustang', year: 2022 },
        first_image: { service_image_url: 'https://images.unsplash.com/photo-1580414053435-2b5d2e1dd6c8?auto=format&fit=crop&w=800&q=80' }
      },
      {
        uuid: '9',
        name: 'Volkswagen Golf GTI',
        sale_price: 380000,
        mileage: 45000,
        exterior_color: 'Azul',
        year: 2020,
        brand: { name: 'Volkswagen' },
        model: { name: 'Golf GTI', year: 2020 },
        first_image: { service_image_url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80' }
      }
    ];

    this.createMixedItems();
    this.populateFilters();
  }

  // Type guards para distinguir entre vehículos y banners
  isVehicle(item: any): item is Vehicle {
    return item && (item as Vehicle).brand !== undefined;
  }

  isBanner(item: any): item is { type: 'banner', title: string, description: string, buttonText: string, imageUrl: string } {
    return item && item.type === 'banner';
  }

  // Crear array mixto con vehículos y banners
  private createMixedItems(): void {
    this.mixedItems = [];
    
    // Agregar vehículos y banners en posiciones específicas
    for (let i = 0; i < this.sampleVehicles.length; i++) {
      this.mixedItems.push(this.sampleVehicles[i]);
      
      // Agregar banner después del 3er, 6to y 9no vehículo
      if (i === 2 || i === 5 || i === 8) {
        this.mixedItems.push({
          type: 'banner',
          title: this.getBannerTitle(i),
          description: this.getBannerDescription(i),
          buttonText: this.getBannerButtonText(i),
          imageUrl: this.getBannerImageUrl(i)
        });
      }
    }
  }

  private getBannerTitle(index: number): string {
    const titles = [
      '¡Financiamiento Especial!',
      'Garantía Extendida',
      'Seguro Automotriz'
    ];
    return titles[Math.floor(index / 3) % titles.length];
  }

  private getBannerDescription(index: number): string {
    const descriptions = [
      'Obtén tu auto con 0% de enganche y tasas preferenciales. Aprobación en 24 horas.',
      'Protege tu inversión con nuestra garantía extendida de hasta 3 años adicionales.',
      'Seguro automotriz con las mejores coberturas y precios del mercado.'
    ];
    return descriptions[Math.floor(index / 3) % descriptions.length];
  }

  private getBannerButtonText(index: number): string {
    const buttons = [
      'Solicitar crédito',
      'Ver garantías',
      'Cotizar seguro'
    ];
    return buttons[Math.floor(index / 3) % buttons.length];
  }

  private getBannerImageUrl(index: number): string {
    const images = [
      'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80'
    ];
    return images[Math.floor(index / 3) % images.length];
  }

  private populateFilters(): void {
    const brands = new Set<string>();
    this.sampleVehicles.forEach(v => {
      if (v.brand) {
        brands.add(v.brand.name);
      }
    });
    this.brands = Array.from(brands).sort();
  }
} 