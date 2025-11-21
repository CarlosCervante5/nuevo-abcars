import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VehicleCardTailwindComponent, Vehicle } from '../shared/components/vehicle-card-tailwind/vehicle-card-tailwind.component';
import { DarkNavComponent } from 'src/app/shared/components/dark-nav/dark-nav.component';
import { ModernFooterComponent } from 'src/app/shared/components/modern-footer/modern-footer.component';
import { VehicleService } from '../shared/services/vehicle.service';
import { CampaingService } from '../shared/services/campaing.service';
import { Vehicle as ApiVehicle } from '../shared/interfaces/vehicle_data.interface';

// Extender Vehicle para incluir apiData
interface VehicleWithApiData extends Vehicle {
  apiData?: ApiVehicle;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, VehicleCardTailwindComponent, DarkNavComponent, ModernFooterComponent],
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
                  [(ngModel)]="searchTerm"
                  (input)="onSearchChange()"
                  placeholder="Busca por modelo, marca, año, características..."
                  class="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all bg-white shadow-sm"
                >
              </div>
            </div>
          </div>

          <!-- Contador de resultados y ordenamiento -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div class="flex items-center justify-between w-full sm:w-auto">
              <h1 class="text-2xl font-bold text-gray-900">{{ filteredItems.length }} Resultados</h1>
              <!-- Botón para abrir filtros en móvil -->
              <button (click)="openFiltersModal()" class="lg:hidden bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                </svg>
                <span>Filtros</span>
              </button>
            </div>
            <div class="flex items-center space-x-4 w-full sm:w-auto">
              <span class="text-gray-600 hidden sm:inline">Ordenar por:</span>
              <select [(ngModel)]="sortBy" (change)="onSortChange()" class="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500">
                <option value="newest">Más recientes</option>
                <option value="price-low">Precio: Menor a mayor</option>
                <option value="price-high">Precio: Mayor a menor</option>
                <option value="mileage-asc">Kilometraje: menor</option>
              </select>
            </div>
          </div>

          <div class="flex flex-col lg:flex-row gap-8">
            <!-- Barra lateral de Filtros mejorada (solo visible en desktop) -->
            <aside class="hidden lg:block lg:w-1/4 xl:w-1/5">
              <div class="sticky top-24 space-y-6">
                
                <!-- Filtros principales -->
                <div>
                  <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div class="p-4 border-b border-gray-200">
                      <h2 class="text-lg font-bold text-gray-900">Filtros</h2>
                    </div>
                  
                  <!-- Filtro Precio -->
                  <div class="border-b border-gray-100">
                    <button (click)="toggleFilter('price')" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Precio</span>
                      <svg [class.rotate-180]="openFilters.price" class="w-4 h-4 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    <div *ngIf="openFilters.price" class="px-4 pb-4">
                      <div class="space-y-2">
                        <div class="flex items-center justify-between text-sm">
                          <span class="text-gray-600">Desde: <span class="font-medium text-gray-900">{{ '$' + formatPrice(filters.priceMin) }}</span></span>
                          <span class="text-gray-600">Hasta: <span class="font-medium text-gray-900">{{ '$' + formatPrice(filters.priceMax) }}</span></span>
                        </div>
                        <div class="relative h-2">
                          <input type="range" [(ngModel)]="filters.priceMin" (input)="applyFilters()" [min]="priceRange.min" [max]="priceRange.max" class="absolute top-0 left-0 w-full h-2 bg-transparent appearance-none cursor-pointer" style="z-index: 2;">
                          <input type="range" [(ngModel)]="filters.priceMax" (input)="applyFilters()" [min]="priceRange.min" [max]="priceRange.max" class="absolute top-0 left-0 w-full h-2 bg-transparent appearance-none cursor-pointer" style="z-index: 1;">
                          <div class="absolute top-0 left-0 w-full h-2 bg-gray-200 rounded-lg" style="z-index: 0;"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Filtro Marca -->
                  <div class="border-b border-gray-100">
                    <button (click)="toggleFilter('brand')" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Marca</span>
                      <svg [class.rotate-180]="openFilters.brand" class="w-4 h-4 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    <div *ngIf="openFilters.brand" class="px-4 pb-4 max-h-48 overflow-y-auto">
                      <div class="space-y-2">
                        <label *ngFor="let brand of availableBrands" class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input type="checkbox" [value]="brand" [(ngModel)]="filters.selectedBrands[brand]" (change)="applyFilters()" class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500">
                          <span class="text-sm text-gray-700">{{ brand }}</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Filtro Año -->
                  <div class="border-b border-gray-100">
                    <button (click)="toggleFilter('year')" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Año</span>
                      <svg [class.rotate-180]="openFilters.year" class="w-4 h-4 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    <div *ngIf="openFilters.year" class="px-4 pb-4">
                      <div class="space-y-2">
                        <div class="flex items-center justify-between text-sm">
                          <span class="text-gray-600">Desde: <span class="font-medium text-gray-900">{{ filters.yearFrom }}</span></span>
                          <span class="text-gray-600">Hasta: <span class="font-medium text-gray-900">{{ filters.yearTo }}</span></span>
                        </div>
                        <div class="relative h-2">
                          <input type="range" [(ngModel)]="filters.yearFrom" (input)="applyFilters()" [min]="yearRange.min" [max]="yearRange.max" class="absolute top-0 left-0 w-full h-2 bg-transparent appearance-none cursor-pointer" style="z-index: 2;">
                          <input type="range" [(ngModel)]="filters.yearTo" (input)="applyFilters()" [min]="yearRange.min" [max]="yearRange.max" class="absolute top-0 left-0 w-full h-2 bg-transparent appearance-none cursor-pointer" style="z-index: 1;">
                          <div class="absolute top-0 left-0 w-full h-2 bg-gray-200 rounded-lg" style="z-index: 0;"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Filtro Kilometraje -->
                  <div class="border-b border-gray-100">
                    <button (click)="toggleFilter('mileage')" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Kilometraje</span>
                      <svg [class.rotate-180]="openFilters.mileage" class="w-4 h-4 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    <div *ngIf="openFilters.mileage" class="px-4 pb-4">
                      <div class="space-y-3">
                        <div class="flex items-center justify-between">
                          <span class="text-sm text-gray-600">Hasta</span>
                          <span class="text-sm font-medium">{{ formatMileage(filters.maxMileage ?? mileageRange.max) }} km</span>
                        </div>
                        <input type="range" [(ngModel)]="filters.maxMileage" (input)="applyFilters()" [min]="mileageRange.min" [max]="mileageRange.max" [value]="filters.maxMileage ?? mileageRange.max" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                      </div>
                    </div>
                  </div>

                  <!-- Filtro Tipo de auto -->
                  <div class="border-b border-gray-100">
                    <button (click)="toggleFilter('body')" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Tipo de auto</span>
                      <svg [class.rotate-180]="openFilters.body" class="w-4 h-4 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    <div *ngIf="openFilters.body" class="px-4 pb-4 max-h-48 overflow-y-auto">
                      <div class="space-y-2">
                        <label *ngFor="let body of availableBodies" class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input type="checkbox" [value]="body" [(ngModel)]="filters.selectedBodies[body]" (change)="applyFilters()" class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500">
                          <span class="text-sm text-gray-700">{{ body }}</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Filtro Mecánica -->
                  <div class="border-b border-gray-100">
                    <button (click)="toggleFilter('transmission')" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Transmisión</span>
                      <svg [class.rotate-180]="openFilters.transmission" class="w-4 h-4 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    <div *ngIf="openFilters.transmission" class="px-4 pb-4">
                      <div class="space-y-2">
                        <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input type="checkbox" value="manual" [(ngModel)]="filters.selectedTransmissions.manual" (change)="applyFilters()" class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500">
                          <span class="text-sm text-gray-700">Manual</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input type="checkbox" value="automatic" [(ngModel)]="filters.selectedTransmissions.automatic" (change)="applyFilters()" class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500">
                          <span class="text-sm text-gray-700">Automática</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Filtro Color exterior -->
                  <div class="border-b border-gray-100">
                    <button (click)="toggleFilter('color')" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span class="font-medium text-gray-700">Color exterior</span>
                      <svg [class.rotate-180]="openFilters.color" class="w-4 h-4 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    <div *ngIf="openFilters.color" class="px-4 pb-4 max-h-48 overflow-y-auto">
                      <div class="space-y-2">
                        <label *ngFor="let color of availableColors" class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input type="checkbox" [value]="color" [(ngModel)]="filters.selectedColors[color]" (change)="applyFilters()" class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500">
                          <span class="text-sm text-gray-700 capitalize">{{ color }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  </div>
                  
                  <!-- Botón limpiar filtros -->
                  <button (click)="clearFilters()" class="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-4 rounded-xl transition-all duration-300 mt-4">
                    Limpiar Filtros
                  </button>
                </div>

                <!-- Promoción (Call to Action) -->
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

              </div>
            </aside>

            <!-- Grid de Vehículos y Banners -->
            <div class="lg:w-3/4 xl:w-4/5">
              <div *ngIf="isLoading" class="text-center py-12">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
                <p class="mt-4 text-gray-600">Cargando vehículos...</p>
              </div>
              <!-- Mensaje de error -->
              <div *ngIf="loadError && !isLoading" class="text-center py-12">
                <div class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
                  <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <h3 class="text-xl font-bold text-red-900 mb-2">Error al cargar vehículos</h3>
                  <p class="text-red-700 mb-4">{{ loadError }}</p>
                  <button (click)="loadVehicles()" class="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">
                    Reintentar
                  </button>
                </div>
              </div>
              <div *ngIf="!isLoading && !loadError && filteredItems.length === 0" class="text-center py-12">
                <p class="text-gray-600 text-lg">No se encontraron vehículos con los filtros seleccionados.</p>
                <button (click)="clearFilters()" class="mt-4 text-yellow-500 hover:text-yellow-600 font-medium">Limpiar filtros</button>
              </div>
              <div *ngIf="!isLoading && !loadError && filteredItems.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <ng-container *ngFor="let item of filteredItems">
                  <!-- Vehículo -->
                  <app-vehicle-card-tailwind *ngIf="isVehicle(item)" [vehicle]="item"></app-vehicle-card-tailwind>
                  
                  <!-- Banner de promoción -->
                  <div *ngIf="isBanner(item)" class="relative rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full">
                    <img 
                      [src]="getBannerImageUrl(item)" 
                      alt="Promoción" 
                      class="w-full h-full object-cover"
                      (error)="onBannerImageError($event)"
                    />
                  </div>
                </ng-container>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    <app-modern-footer></app-modern-footer>

    <!-- Modal de Filtros para Móvil -->
    <div *ngIf="showFiltersModal" class="fixed inset-0 z-50 lg:hidden" (click)="closeFiltersModal()">
      <div class="absolute inset-0 bg-black bg-opacity-50"></div>
      <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
          <h2 class="text-xl font-bold text-gray-900">Filtros</h2>
          <button (click)="closeFiltersModal()" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="p-4 space-y-6">
          
          <!-- Filtro Precio -->
          <div class="border-b border-gray-100 pb-4">
            <button (click)="toggleFilter('price')" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span class="font-medium text-gray-700">Precio</span>
              <svg [class.rotate-180]="openFilters.price" class="w-4 h-4 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <div *ngIf="openFilters.price" class="px-4 pb-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">Desde: <span class="font-medium text-gray-900">{{ '$' + formatPrice(filters.priceMin) }}</span></span>
                  <span class="text-gray-600">Hasta: <span class="font-medium text-gray-900">{{ '$' + formatPrice(filters.priceMax) }}</span></span>
                </div>
                <div class="relative h-2">
                  <input type="range" [(ngModel)]="filters.priceMin" (input)="applyFilters()" [min]="priceRange.min" [max]="priceRange.max" class="absolute top-0 left-0 w-full h-2 bg-transparent appearance-none cursor-pointer" style="z-index: 2;">
                  <input type="range" [(ngModel)]="filters.priceMax" (input)="applyFilters()" [min]="priceRange.min" [max]="priceRange.max" class="absolute top-0 left-0 w-full h-2 bg-transparent appearance-none cursor-pointer" style="z-index: 1;">
                  <div class="absolute top-0 left-0 w-full h-2 bg-gray-200 rounded-lg" style="z-index: 0;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Filtro Marca -->
          <div class="border-b border-gray-100 pb-4">
            <button (click)="toggleFilter('brand')" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span class="font-medium text-gray-700">Marca</span>
              <svg [class.rotate-180]="openFilters.brand" class="w-4 h-4 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <div *ngIf="openFilters.brand" class="px-4 pb-4 max-h-48 overflow-y-auto">
              <div class="space-y-2">
                <label *ngFor="let brand of availableBrands" class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="checkbox" [value]="brand" [(ngModel)]="filters.selectedBrands[brand]" (change)="applyFilters()" class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500">
                  <span class="text-sm text-gray-700">{{ brand }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Filtro Año -->
          <div class="border-b border-gray-100 pb-4">
            <button (click)="toggleFilter('year')" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span class="font-medium text-gray-700">Año</span>
              <svg [class.rotate-180]="openFilters.year" class="w-4 h-4 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <div *ngIf="openFilters.year" class="px-4 pb-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">Desde: <span class="font-medium text-gray-900">{{ filters.yearFrom }}</span></span>
                  <span class="text-gray-600">Hasta: <span class="font-medium text-gray-900">{{ filters.yearTo }}</span></span>
                </div>
                <div class="relative h-2">
                  <input type="range" [(ngModel)]="filters.yearFrom" (input)="applyFilters()" [min]="yearRange.min" [max]="yearRange.max" class="absolute top-0 left-0 w-full h-2 bg-transparent appearance-none cursor-pointer" style="z-index: 2;">
                  <input type="range" [(ngModel)]="filters.yearTo" (input)="applyFilters()" [min]="yearRange.min" [max]="yearRange.max" class="absolute top-0 left-0 w-full h-2 bg-transparent appearance-none cursor-pointer" style="z-index: 1;">
                  <div class="absolute top-0 left-0 w-full h-2 bg-gray-200 rounded-lg" style="z-index: 0;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Filtro Kilometraje -->
          <div class="border-b border-gray-100 pb-4">
            <button (click)="toggleFilter('mileage')" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span class="font-medium text-gray-700">Kilometraje</span>
              <svg [class.rotate-180]="openFilters.mileage" class="w-4 h-4 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <div *ngIf="openFilters.mileage" class="px-4 pb-4">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Hasta</span>
                  <span class="text-sm font-medium">{{ formatMileage(filters.maxMileage ?? mileageRange.max) }} km</span>
                </div>
                <input type="range" [(ngModel)]="filters.maxMileage" (input)="applyFilters()" [min]="mileageRange.min" [max]="mileageRange.max" [value]="filters.maxMileage ?? mileageRange.max" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              </div>
            </div>
          </div>

          <!-- Filtro Tipo de auto -->
          <div class="border-b border-gray-100 pb-4">
            <button (click)="toggleFilter('body')" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span class="font-medium text-gray-700">Tipo de auto</span>
              <svg [class.rotate-180]="openFilters.body" class="w-4 h-4 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <div *ngIf="openFilters.body" class="px-4 pb-4 max-h-48 overflow-y-auto">
              <div class="space-y-2">
                <label *ngFor="let body of availableBodies" class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="checkbox" [value]="body" [(ngModel)]="filters.selectedBodies[body]" (change)="applyFilters()" class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500">
                  <span class="text-sm text-gray-700">{{ body }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Filtro Transmisión -->
          <div class="border-b border-gray-100 pb-4">
            <button (click)="toggleFilter('transmission')" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span class="font-medium text-gray-700">Transmisión</span>
              <svg [class.rotate-180]="openFilters.transmission" class="w-4 h-4 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <div *ngIf="openFilters.transmission" class="px-4 pb-4">
              <div class="space-y-2">
                <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="checkbox" value="manual" [(ngModel)]="filters.selectedTransmissions.manual" (change)="applyFilters()" class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500">
                  <span class="text-sm text-gray-700">Manual</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="checkbox" value="automatic" [(ngModel)]="filters.selectedTransmissions.automatic" (change)="applyFilters()" class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500">
                  <span class="text-sm text-gray-700">Automática</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Filtro Color exterior -->
          <div class="border-b border-gray-100 pb-4">
            <button (click)="toggleFilter('color')" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span class="font-medium text-gray-700">Color exterior</span>
              <svg [class.rotate-180]="openFilters.color" class="w-4 h-4 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <div *ngIf="openFilters.color" class="px-4 pb-4 max-h-48 overflow-y-auto">
              <div class="space-y-2">
                <label *ngFor="let color of availableColors" class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="checkbox" [value]="color" [(ngModel)]="filters.selectedColors[color]" (change)="applyFilters()" class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500">
                  <span class="text-sm text-gray-700 capitalize">{{ color }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Botón limpiar filtros -->
          <button (click)="clearFilters()" class="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-4 rounded-xl transition-all duration-300 mb-4">
            Limpiar Filtros
          </button>

          <!-- Call to Action en móvil -->
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

        </div>
      </div>
    </div>
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
  
  // Propiedades de búsqueda y filtrado
  searchTerm: string = '';
  sortBy: string = 'newest';
  
  // Datos de vehículos
  sampleVehicles: VehicleWithApiData[] = [];
  mixedItems: (VehicleWithApiData | { type: 'banner'; imageUrl?: string })[] = [];
  filteredItems: (VehicleWithApiData | { type: 'banner'; imageUrl?: string })[] = [];
  activePromotionImages: string[] = [];
  
  brands: string[] = [];
  isLoading: boolean = true;
  loadError: string = '';

  // Modal de filtros para móvil
  showFiltersModal: boolean = false;
  
  filters = {
    priceMin: 0,
    priceMax: 2000000,
    selectedBrands: {} as { [key: string]: boolean },
    yearFrom: 0,
    yearTo: new Date().getFullYear(),
    maxMileage: null as number | null,
    selectedBodies: {} as { [key: string]: boolean },
    selectedTransmissions: {
      manual: false,
      automatic: false
    },
    selectedColors: {} as { [key: string]: boolean }
  };

  // Acordeones
  openFilters: { [key: string]: boolean } = {
    price: false,
    brand: false,
    year: false,
    mileage: false,
    body: false,
    transmission: false,
    color: false
  };

  // Datos disponibles para filtros
  availableBrands: string[] = [];
  availableBodies: string[] = ['Sedán', 'SUV', 'Hatchback', 'Pickup', 'Coupe', 'Convertible', 'Minivan'];
  availableColors: string[] = ['Negro', 'Blanco', 'Gris', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Beige'];

  // Rangos
  priceRange = { min: 0, max: 2000000 };
  yearRange = { min: 2000, max: new Date().getFullYear() };
  mileageRange = { min: 0, max: 200000 };

  constructor(
    private vehicleService: VehicleService,
    private campaingService: CampaingService
  ) {}

  ngOnInit(): void {
    // Cargar promociones primero, los vehículos se cargarán cuando las promociones estén listas
    this.loadActivePromotions();
  }

  loadActivePromotions() {
    // Llamar al endpoint público sin headers de autenticación
    this.campaingService.getCampaingPublic().subscribe({
      next: (response) => {
        console.log('📦 [INVENTORY] Respuesta completa de promociones:', response);
        
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
          console.log('✅ [INVENTORY] Promociones activas cargadas:', this.activePromotionImages.length, 'imágenes');
          
          // Si ya se cargaron vehículos, reinsertar banners con las promociones
          if (this.sampleVehicles.length > 0) {
            if (this.activePromotionImages.length > 0) {
              const vehiclesWithBanners = this.insertBannersRandomly(this.sampleVehicles, this.activePromotionImages);
              this.mixedItems = vehiclesWithBanners;
              this.filteredItems = [...this.mixedItems];
              console.log('✅ [INVENTORY] Banners actualizados con promociones');
            }
          } else {
            // Si los vehículos aún no se han cargado, cargarlos ahora que las promociones están listas
            this.loadVehicles();
          }
        } else {
          console.warn('⚠️ [INVENTORY] Respuesta sin estructura esperada:', response);
          // Si no hay promociones, cargar vehículos de todas formas
          if (this.sampleVehicles.length === 0) {
            this.loadVehicles();
          }
        }
      },
      error: (error) => {
        console.error('❌ [INVENTORY] Error al cargar promociones activas:', error);
        this.activePromotionImages = [];
        // Si hay error, cargar vehículos de todas formas
        if (this.sampleVehicles.length === 0) {
          this.loadVehicles();
        }
      }
    });
  }

  loadVehicles(): void {
    console.log('🚀 [INVENTORY] Iniciando carga de vehículos desde la API...');
    this.isLoading = true;
    this.loadError = '';

    this.vehicleService.searchVehicles({}, 1, 20).subscribe({
      next: (response) => {
        console.log('📦 [INVENTORY] Respuesta de la API recibida:', response);
        
        if (response.status === 200 && response.data && response.data.data) {
          const apiVehicles = response.data.data;
          console.log(`✅ [INVENTORY] ${apiVehicles.length} vehículos recibidos de la API`);
          
          // Mapear vehículos de la API para incluir el año desde model.year y guardar apiData
          this.sampleVehicles = apiVehicles.map(v => ({
            ...v,
            year: v.model?.year || new Date().getFullYear(),
            apiData: v
          }));
          
          console.log('🔄 [INVENTORY] Vehículos mapeados:', this.sampleVehicles.length);
          
          // Insertar banners con promociones activas o banner por defecto
          let vehiclesWithBanners: (VehicleWithApiData | { type: 'banner'; imageUrl?: string })[];
          
          if (this.activePromotionImages.length > 0) {
            // Insertar 2 banners aleatoriamente con promociones activas seleccionadas aleatoriamente
            vehiclesWithBanners = this.insertBannersRandomly(this.sampleVehicles, this.activePromotionImages);
            console.log('✅ [INVENTORY] Banners de promociones insertados aleatoriamente');
          } else {
            // Insertar banner por defecto después de 3 vehículos
            vehiclesWithBanners = [
              ...this.sampleVehicles.slice(0, 3),
              { type: 'banner' },
              ...this.sampleVehicles.slice(3)
            ];
            console.log('✅ [INVENTORY] Banner por defecto insertado (sin promociones activas)');
          }

          this.mixedItems = vehiclesWithBanners;
          this.filteredItems = [...this.mixedItems];
          this.populateFilters();
          console.log('✅ [INVENTORY] Vehículos cargados exitosamente. Total con banner:', this.mixedItems.length);
        } else {
          console.warn('⚠️ [INVENTORY] Respuesta de la API sin datos esperados:', response);
          this.loadError = 'Error al cargar los vehículos. Por favor, intenta de nuevo más tarde.';
          this.loadFallbackVehicles();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ [INVENTORY] Error al cargar vehículos:', error);
        console.error('❌ [INVENTORY] Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          error: error.error
        });
        this.loadError = 'Error al cargar los vehículos. Por favor, intenta de nuevo más tarde.';
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

    // Insertar banners con promociones activas o banner por defecto
    let vehiclesWithBanners: (Vehicle | { type: 'banner'; imageUrl?: string })[];
    
    if (this.activePromotionImages.length > 0) {
      vehiclesWithBanners = this.insertBannersRandomly(this.sampleVehicles, this.activePromotionImages);
    } else {
      vehiclesWithBanners = [
        ...this.sampleVehicles.slice(0, 3),
        { type: 'banner' },
        ...this.sampleVehicles.slice(3)
      ];
    }

    this.mixedItems = vehiclesWithBanners;
    this.filteredItems = [...this.mixedItems];
    this.populateFilters();
  }

  // Type guards para distinguir entre vehículos y banners
  isVehicle(item: any): item is VehicleWithApiData {
    return item && (item as VehicleWithApiData).brand !== undefined;
  }

  isBanner(item: any): item is { type: 'banner'; imageUrl?: string } {
    return item && item.type === 'banner';
  }

  insertBannersRandomly(vehicles: VehicleWithApiData[], promotionImages: string[]): (VehicleWithApiData | { type: 'banner'; imageUrl?: string })[] {
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
    const result: (VehicleWithApiData | { type: 'banner'; imageUrl?: string })[] = [];
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

  getBannerImageUrl(item: any): string {
    if (this.isBanner(item)) {
      if (item.imageUrl) {
        return item.imageUrl;
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

  onSearchChange() {
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  applyFilters() {
    // 1) Separar vehículos y banners (preservar banners con sus imágenes)
    const banners: { type: 'banner'; imageUrl?: string }[] = this.mixedItems.filter((i: any) => this.isBanner(i)) as { type: 'banner'; imageUrl?: string }[];
    const vehicleItems: Vehicle[] = (this.mixedItems.filter((i: any) => this.isVehicle(i)) as Vehicle[]);

    // 2) Preparar helpers de coincidencia
    const normalizedSearch = (this.searchTerm || '').toString().trim().toLowerCase();

    // 3) Aplicar filtros de búsqueda y filtros avanzados
    const filteredVehicles: VehicleWithApiData[] = vehicleItems.filter((item: VehicleWithApiData) => {
      // Búsqueda por texto
      const brand = (item.brand?.name || '').toString();
      const model = (item.model?.name || '').toString();
      const name = (item.name || '').toString();
      const uuid = (item.uuid || '').toString().toLowerCase();
      const vin = (item.apiData?.vin || '').toString().toLowerCase();
      const textHaystack = `${uuid} ${vin} ${brand} ${model} ${item.year} ${name}`.toLowerCase();
      const matchesSearch = !normalizedSearch || textHaystack.includes(normalizedSearch);

      // Filtro de precio
      const matchesPrice = (item.sale_price || 0) >= this.filters.priceMin && (item.sale_price || 0) <= this.filters.priceMax;

      // Filtro de marca
      const selectedBrands = Object.keys(this.filters.selectedBrands).filter(key => this.filters.selectedBrands[key]);
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(brand);

      // Filtro de año
      const itemYear = item.year || item.model?.year || new Date().getFullYear();
      const matchesYear = itemYear >= this.filters.yearFrom && itemYear <= this.filters.yearTo;

      // Filtro de kilometraje
      const matchesMileage = !this.filters.maxMileage || (item.mileage || 0) <= this.filters.maxMileage;

      // Filtro de tipo de auto (body)
      const selectedBodies = Object.keys(this.filters.selectedBodies).filter(key => this.filters.selectedBodies[key]);
      const itemBody = (item as any).body?.name || item.apiData?.body?.name || '';
      const matchesBody = selectedBodies.length === 0 || selectedBodies.includes(itemBody);

      // Filtro de transmisión
      const transmission = ((item as any).transmission || item.apiData?.transmission || '').toLowerCase();
      const matchesTransmission = 
        (!this.filters.selectedTransmissions.manual && !this.filters.selectedTransmissions.automatic) ||
        (this.filters.selectedTransmissions.manual && transmission.includes('manual')) ||
        (this.filters.selectedTransmissions.automatic && (transmission.includes('automatic') || transmission.includes('automática')));

      // Filtro de color
      const selectedColors = Object.keys(this.filters.selectedColors).filter(key => this.filters.selectedColors[key]);
      const itemColor = (item.exterior_color || '').toLowerCase();
      const matchesColor = selectedColors.length === 0 || selectedColors.some(color => itemColor.includes(color.toLowerCase()));

      return matchesSearch && matchesPrice && matchesBrand && matchesYear && matchesMileage && matchesBody && matchesTransmission && matchesColor;
    });

    // 4) Aplicar ordenamiento sobre vehículos filtrados
    this.sortVehicles(filteredVehicles);

    // 5) Reinsertar banners aleatoriamente si hay promociones activas, o banner por defecto
    let rebuilt: (VehicleWithApiData | { type: 'banner'; imageUrl?: string })[];
    
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

    this.filteredItems = rebuilt;
  }

  sortVehicles(vehicles: VehicleWithApiData[]) {
    vehicles.sort((a, b) => {
      switch (this.sortBy) {
        case 'price-low': 
          return (a.sale_price || 0) - (b.sale_price || 0);
        case 'price-high': 
          return (b.sale_price || 0) - (a.sale_price || 0);
        case 'mileage-asc':
          return (a.mileage || 0) - (b.mileage || 0);
        case 'newest':
        default: 
          return (b.year || 0) - (a.year || 0);
      }
    });
  }

  private populateFilters(): void {
    const brands = new Set<string>();
    this.sampleVehicles.forEach(v => {
      if (v.brand) {
        brands.add(v.brand.name);
      }
    });
    this.brands = Array.from(brands).sort();
    this.availableBrands = this.brands;
    
    // Inicializar checkboxes
    this.availableBrands.forEach(brand => {
      this.filters.selectedBrands[brand] = false;
    });
    this.availableBodies.forEach(body => {
      this.filters.selectedBodies[body] = false;
    });
    this.availableColors.forEach(color => {
      this.filters.selectedColors[color] = false;
    });

    // Calcular rangos
    if (this.sampleVehicles.length > 0) {
      const prices = this.sampleVehicles.map(v => v.sale_price);
      this.priceRange.min = Math.min(...prices);
      this.priceRange.max = Math.max(...prices);
      this.filters.priceMin = this.priceRange.min;
      this.filters.priceMax = this.priceRange.max;

      const years = this.sampleVehicles.map(v => v.year || v.model?.year || new Date().getFullYear());
      this.yearRange.min = Math.min(...years);
      this.yearRange.max = Math.max(...years);
      this.filters.yearFrom = this.yearRange.min;
      this.filters.yearTo = this.yearRange.max;

      const mileages = this.sampleVehicles.map(v => v.mileage || 0);
      this.mileageRange.min = 0;
      this.mileageRange.max = Math.max(...mileages, 200000);
      if (!this.filters.maxMileage) {
        this.filters.maxMileage = this.mileageRange.max;
      }
    }

    // Aplicar filtros iniciales
    this.applyFilters();
  }

  toggleFilter(filterName: string): void {
    this.openFilters[filterName] = !this.openFilters[filterName];
  }

  openFiltersModal(): void {
    this.showFiltersModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeFiltersModal(): void {
    this.showFiltersModal = false;
    document.body.style.overflow = '';
  }


  clearFilters(): void {
    this.searchTerm = '';
    this.filters.priceMin = this.priceRange.min;
    this.filters.priceMax = this.priceRange.max;
    this.filters.yearFrom = this.yearRange.min;
    this.filters.yearTo = this.yearRange.max;
    this.filters.maxMileage = this.mileageRange.max;
    this.filters.selectedBrands = {};
    this.filters.selectedBodies = {};
    this.filters.selectedTransmissions = { manual: false, automatic: false };
    this.filters.selectedColors = {};
    this.sortBy = 'newest';
    
    // Reinicializar checkboxes
    this.availableBrands.forEach(brand => {
      this.filters.selectedBrands[brand] = false;
    });
    this.availableBodies.forEach(body => {
      this.filters.selectedBodies[body] = false;
    });
    this.availableColors.forEach(color => {
      this.filters.selectedColors[color] = false;
    });
    
    this.applyFilters();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  formatMileage(mileage: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(mileage);
  }
} 