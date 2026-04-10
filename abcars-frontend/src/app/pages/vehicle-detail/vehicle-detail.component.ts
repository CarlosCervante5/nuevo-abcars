import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { DarkNavComponent } from '../../shared/components/dark-nav/dark-nav.component';
import { ModernFooterComponent } from '../../shared/components/modern-footer/modern-footer.component';
import { VehicleService } from '../../shared/services/vehicle.service';
import { LeadService } from '../../shared/services/lead.service';
import { ReferralService } from '../../shared/services/referral.service';
import { Vehicle as ApiVehicle } from '../../shared/interfaces/vehicle_data.interface';
import { Dealership, DealerShipResponse } from '../../shared/interfaces/admin.interfaces';
import { FALLBACK_HERO_IMAGE } from '../../shared/constants/fallback-media';
import Swal from 'sweetalert2';

interface Vehicle {
  uuid: string;
  id?: number;
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
  video_url?: string;
  view360_url?: string;
  name?: string;
  description?: string;
  exterior_color?: string;
  interior_color?: string;
  cylinders?: number;
  dealership?: string;
  location?: string;
  apiData?: ApiVehicle;
}

interface MediaItem {
  type: 'image' | 'video' | 'view360';
  url: string;
  thumbnail?: string;
  title?: string;
}

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ModernFooterComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      
      <!-- Header de navegación -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <button 
                (click)="goBack()"
                class="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                <span class="font-medium hidden md:inline">Volver al catálogo</span>
                <span class="font-medium md:hidden">Volver</span>
              </button>
              
              <!-- Título del vehículo - oculto en móvil -->
              <div *ngIf="vehicle" class="hidden lg:flex items-center">
                <div class="h-6 w-px bg-gray-300 mx-4"></div>
                <div>
                  <h1 class="text-xl lg:text-2xl font-bold text-gray-900"><span class="uppercase">{{ vehicle.brand }}</span> {{ vehicle.model }}</h1>
                  <p class="text-sm text-gray-600">{{ vehicle.year }} • {{ getEngineInfo() }}</p>
                </div>
              </div>
            </div>

            <!-- Logo ABCars -->
            <div class="flex items-center space-x-3">
              <img src="../assets/images/logo.svg" class="h-10 transition-all" alt="ABCars Logo">
            </div>
          </div>
        </div>
      </header>

      <!-- Contenido principal -->
      <main class="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8" *ngIf="vehicle">
        
        <!-- Grid principal -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-12">
          
          <!-- Columna izquierda: Imagen y galería -->
          <div class="xl:col-span-2">
            <!-- Galería moderna -->
            <div class="bg-white rounded-3xl overflow-hidden mb-8 shadow-sm">
              <!-- Media principal -->
              <div class="relative">
                <!-- Imagen -->
                <img 
                  *ngIf="mediaItems[selectedMediaIndex]?.type === 'image'"
                  [src]="mediaItems[selectedMediaIndex].url" 
                  [alt]="mediaItems[selectedMediaIndex].title"
                  class="w-full h-96 lg:h-[500px] object-cover cursor-pointer transition-all duration-300 hover:scale-105 gallery-main-image gallery-transition"
                  (click)="openLightbox()"
                />
                
                <!-- Video -->
                <div 
                  *ngIf="mediaItems[selectedMediaIndex]?.type === 'video'"
                  class="w-full h-96 lg:h-[500px] bg-black rounded-lg overflow-hidden relative cursor-pointer"
                  (click)="openLightbox()"
                >
                  <video 
                    [src]="mediaItems[selectedMediaIndex].url"
                    class="w-full h-full object-cover"
                    controls
                    preload="metadata"
                    (click)="$event.stopPropagation()"
                  >
                    Tu navegador no soporta videos HTML5.
                  </video>
                  <div class="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div class="bg-white/90 rounded-full p-4">
                      <svg class="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <!-- Vista 360 -->
                <div 
                  *ngIf="mediaItems[selectedMediaIndex]?.type === 'view360'"
                  class="w-full h-96 lg:h-[500px] bg-gray-100 rounded-lg overflow-hidden relative cursor-pointer"
                  (click)="openLightbox()"
                >
                  <iframe 
                    [src]="mediaItems[selectedMediaIndex].url"
                    class="w-full h-full border-0"
                    allowfullscreen
                    loading="lazy"
                    (click)="$event.stopPropagation()"
                  ></iframe>
                  <div class="absolute top-4 left-4 bg-white/90 rounded-full px-3 py-1 text-sm font-medium text-gray-800">
                    Vista 360°
                  </div>
                </div>
                
                <!-- Botones de navegación -->
                <button 
                  (click)="previousImage()"
                  class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm gallery-button gallery-transition"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                
                <button 
                  (click)="nextImage()"
                  class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm gallery-button gallery-transition"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>

                <!-- Indicador de media -->
                <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                  {{ selectedMediaIndex + 1 }} / {{ mediaItems.length }}
                  <span class="ml-2 text-xs opacity-75">
                    {{ mediaItems[selectedMediaIndex].type === 'image' ? 'Imagen' : 
                       mediaItems[selectedMediaIndex].type === 'video' ? 'Video' : 'Vista 360°' }}
                  </span>
                </div>

                <!-- Botón de expandir -->
                <button 
                  (click)="openLightbox()"
                  class="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm gallery-button gallery-transition"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                  </svg>
                </button>
              </div>

              <!-- Miniaturas -->
              <div class="p-4 bg-gray-50 gallery-thumbnails">
                <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide gallery-container">
                  <div 
                    *ngFor="let media of mediaItems; let i = index"
                    (click)="selectMedia(i)"
                    class="flex-shrink-0 cursor-pointer transition-all duration-300 hover:opacity-80 relative"
                    [class.opacity-100]="i === selectedMediaIndex"
                    [class.opacity-60]="i !== selectedMediaIndex"
                  >
                    <!-- Thumbnail de imagen -->
                    <img 
                      *ngIf="media.type === 'image'"
                      [src]="media.thumbnail" 
                      [alt]="media.title"
                      class="w-20 h-16 object-cover rounded-lg border-2 transition-all duration-300 gallery-thumbnail gallery-transition"
                      [class.border-yellow-500]="i === selectedMediaIndex"
                      [class.border-gray-300]="i !== selectedMediaIndex"
                    />
                    
                    <!-- Thumbnail de video -->
                    <div 
                      *ngIf="media.type === 'video'"
                      class="w-20 h-16 bg-black rounded-lg border-2 transition-all duration-300 gallery-thumbnail gallery-transition flex items-center justify-center relative overflow-hidden"
                      [class.border-yellow-500]="i === selectedMediaIndex"
                      [class.border-gray-300]="i !== selectedMediaIndex"
                    >
                      <img 
                        [src]="media.thumbnail" 
                        [alt]="media.title"
                        class="w-full h-full object-cover opacity-60"
                      />
                      <div class="absolute inset-0 flex items-center justify-center">
                        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <div class="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                        VIDEO
                      </div>
                    </div>
                    
                    <!-- Thumbnail de vista 360 -->
                    <div 
                      *ngIf="media.type === 'view360'"
                      class="w-20 h-16 bg-gray-200 rounded-lg border-2 transition-all duration-300 gallery-thumbnail gallery-transition flex items-center justify-center relative overflow-hidden"
                      [class.border-yellow-500]="i === selectedMediaIndex"
                      [class.border-gray-300]="i !== selectedMediaIndex"
                    >
                      <img 
                        [src]="media.thumbnail" 
                        [alt]="media.title"
                        class="w-full h-full object-cover opacity-60"
                      />
                      <div class="absolute inset-0 flex items-center justify-center">
                        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                        </svg>
                      </div>
                      <div class="absolute bottom-1 right-1 bg-blue-600/70 text-white text-xs px-1 rounded">
                        360°
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Breadcrumb y título -->
            <div class="mb-8">
              <nav class="flex text-sm text-gray-500 mb-4">
                <a (click)="goBack()" class="hover:text-gray-700 cursor-pointer">Catálogo</a>
                <span class="mx-2">/</span>
                <span class="text-gray-900"><span class="uppercase">{{ vehicle.brand }}</span> {{ vehicle.model }}</span>
              </nav>
              
              <div class="flex items-start justify-between">
                <div>
                  <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 uppercase">{{ vehicle.brand }}</h1>
                  <p class="text-xl lg:text-2xl text-gray-600 mb-4">{{ vehicle.model }} {{ getEngineInfo() }}</p>
                </div>
              </div>
            </div>

            <!-- Sección de precios y contacto (solo móvil, aparece antes de Highlights) -->
            <div class="xl:hidden mb-8">
              <div class="space-y-6">
                
                <!-- Precio destacado -->
                <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-3xl p-8 shadow-sm">
                  <div class="text-center">
                    <div class="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                      MXN {{ vehicle.price | number }}
                    </div>
                    <div class="text-lg text-gray-600 mb-6">Precio de venta</div>
                    
                    <!-- Detalles del financiamiento -->
                    <div class="space-y-4 text-left">
                      <div class="flex justify-between items-center">
                        <span class="text-gray-600">Enganche (30%)</span>
                        <span class="font-semibold text-gray-900">MXN {{ getDownPayment() | number }}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-gray-600">Pago desde · Mensualidad ({{ getMaxAvailableTerm(vehicle?.year) }} meses)</span>
                        <span class="font-semibold text-gray-900">MXN {{ getMonthlyFinancingForDetails() | number }}</span>
                      </div>
                    </div>
                    
                    <!-- Botón de calculadora -->
                    <div class="mt-6">
                      <button 
                        (click)="openCalculatorModal()"
                        class="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-2xl text-sm transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                      >
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                        </svg>
                        Simulador de crédito
                      </button>
                    </div>
                    
                    <!-- Aviso importante -->
                    <div class="mt-4 p-3 bg-gray-50 rounded-xl border-l-4 border-yellow-400">
                      <p class="text-xs text-gray-600 leading-relaxed">
                        <strong class="text-gray-700">Importante:</strong> Los montos mostrados son una aproximación y no constituyen una oferta final ya que esta puede cambiar de acuerdo a tu historial crediticio, enganche y tasa vigente. Crédito sujeto a términos y condiciones de las instituciones financieras otorgantes.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Botones de acción -->
                <div class="bg-white rounded-3xl p-6 shadow-sm">
                  <div class="space-y-4">
                    <button 
                      (click)="openFinancingModal()"
                      class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14H5c-.55 0-1-.45-1-1V8h16v9c0 .55-.45 1-1 1z"/>
                      </svg>
                      Solicitar financiamiento
                    </button>
                    
                    <button 
                      (click)="openWhatsAppModal()"
                      class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
                      </svg>
                      WhatsApp
                    </button>
                    
                    <button 
                      (click)="openTestDriveModal()"
                      class="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                      </svg>
                      Agendar prueba de manejo
                    </button>
                    
                    <button 
                      (click)="openOfferModal()"
                      class="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-bold py-4 px-6 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Haz una oferta
                    </button>
                  </div>
                </div>

                <!-- Información del showroom -->
                <div class="bg-white rounded-3xl p-6 shadow-sm">
                  <h4 class="font-bold text-gray-900 mb-4">Showroom ABCars</h4>
                  <div class="space-y-3 text-sm text-gray-600">
                    <div class="flex items-center space-x-2" *ngIf="vehicle?.location || vehicle?.apiData?.dealership?.location">
                      <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span>{{ capitalizeFirst(vehicle.location || vehicle.apiData?.dealership?.location || '') }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Highlights/Descripción del vehículo -->
            <div class="bg-white rounded-3xl p-4 md:p-6 lg:p-8 mb-4 md:mb-6 lg:mb-8 shadow-sm">
              <h2 class="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 md:mb-6 lg:mb-8">Highlights</h2>
              <div *ngIf="vehicle?.description" class="text-gray-700 leading-relaxed">
                <p class="text-sm md:text-base lg:text-lg whitespace-pre-line">{{ vehicle.description }}</p>
                </div>
              <div *ngIf="!vehicle?.description" class="text-gray-500 italic">
                <p class="text-sm md:text-base">No hay descripción disponible para este vehículo.</p>
              </div>
            </div>

            <!-- Resto de contenido (Especificaciones, Equipamiento, Historial) -->
            <div>

            <!-- Especificaciones completas -->
            <div class="bg-white rounded-3xl shadow-sm mb-8 overflow-hidden">
              <!-- Header clickeable solo en móvil -->
              <div 
                class="p-6 md:p-8 cursor-pointer md:cursor-default flex items-center justify-between"
                (click)="toggleSpecs()"
              >
                <h2 class="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Especificaciones técnicas</h2>
                <!-- Icono chevron solo visible en móvil -->
                <svg 
                  class="w-6 h-6 text-gray-600 transition-transform duration-300 md:hidden"
                  [class.rotate-180]="isSpecsOpen"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              
              <!-- Contenido desplegable -->
              <div 
                class="px-6 md:px-8 transition-all duration-300 overflow-hidden"
                [class.max-h-0]="!isSpecsOpen"
                [class.max-h-[5000px]]="isSpecsOpen"
                [class.pb-6]="isSpecsOpen"
                [class.pb-0]="!isSpecsOpen"
                [class.md:max-h-none]="true"
                [class.md:pb-8]="true"
              >
                <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <div *ngFor="let spec of getSpecifications()" class="bg-gray-50 rounded-2xl p-4 md:p-6">
                    <div class="text-xs md:text-sm text-gray-500 mb-1">{{ spec.label }}</div>
                    <div class="text-sm md:text-lg font-semibold text-gray-900">{{ spec.value }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Equipamiento y características -->
            <!--
            <div class="bg-white rounded-3xl shadow-sm mb-8 overflow-hidden">
              <div 
                class="p-6 md:p-8 cursor-pointer md:cursor-default flex items-center justify-between"
                (click)="toggleEquipment()"
              >
                <h2 class="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Equipamiento y características</h2>
                <svg 
                  class="w-6 h-6 text-gray-600 transition-transform duration-300 md:hidden"
                  [class.rotate-180]="isEquipmentOpen"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              
              <div 
                class="px-6 md:px-8 transition-all duration-300 overflow-hidden"
                [class.max-h-0]="!isEquipmentOpen"
                [class.max-h-[5000px]]="isEquipmentOpen"
                [class.pb-6]="isEquipmentOpen"
                [class.pb-0]="!isEquipmentOpen"
                [class.md:max-h-none]="true"
                [class.md:pb-8]="true"
              >
                <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div *ngFor="let equipment of getEquipment()" class="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl">
                    <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                    <span class="text-gray-700">{{ equipment }}</span>
                  </div>
                </div>
              </div>
            </div>
            -->

            <!-- Historial del vehículo -->
            <div class="bg-white rounded-3xl shadow-sm mb-8 overflow-hidden">
              <!-- Header clickeable solo en móvil -->
              <div 
                class="p-6 md:p-8 cursor-pointer md:cursor-default flex items-center justify-between"
                (click)="toggleHistory()"
              >
                <h2 class="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Historial del vehículo</h2>
                <!-- Icono chevron solo visible en móvil -->
                <svg 
                  class="w-6 h-6 text-gray-600 transition-transform duration-300 md:hidden"
                  [class.rotate-180]="isHistoryOpen"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              
              <!-- Contenido desplegable -->
              <div 
                class="px-6 md:px-8 transition-all duration-300 overflow-hidden"
                [class.max-h-0]="!isHistoryOpen"
                [class.max-h-[5000px]]="isHistoryOpen"
                [class.pb-6]="isHistoryOpen"
                [class.pb-0]="!isHistoryOpen"
                [class.md:max-h-none]="true"
                [class.md:pb-8]="true"
              >
                <div class="space-y-6">
                  <div class="flex items-start space-x-4 p-6 bg-green-50 rounded-2xl border-l-4 border-green-500">
                    <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-semibold text-gray-900 mb-1">Inspección técnica completa</h3>
                      <p class="text-sm text-gray-700">El vehículo ha pasado todas las verificaciones técnicas y está en excelente estado.</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start space-x-4 p-6 bg-blue-50 rounded-2xl border-l-4 border-blue-500">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-semibold text-gray-900 mb-1">Mantenimiento al día</h3>
                      <p class="text-sm text-gray-700">Todos los servicios de mantenimiento están al corriente según el programa del fabricante.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            </div> <!-- Fin del wrapper del resto de contenido -->

          </div>

          <!-- Columna derecha: Información de leasing y contacto (solo desktop) -->
          <div class="hidden xl:block xl:col-span-1">
            <div class="xl:sticky xl:top-8 space-y-6">
              
              <!-- Precio destacado -->
              <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-3xl p-8 shadow-sm">
                <div class="text-center">
                  <div class="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                    MXN {{ vehicle.price | number }}
                  </div>
                  <div class="text-lg text-gray-600 mb-6">Precio de venta</div>
                  
                  <!-- Detalles del financiamiento -->
                  <div class="space-y-4 text-left">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600">Enganche (30%)</span>
                      <span class="font-semibold text-gray-900">MXN {{ getDownPayment() | number }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600">Pago desde · Mensualidad ({{ getMaxAvailableTerm(vehicle?.year) }} meses)</span>
                      <span class="font-semibold text-gray-900">MXN {{ getMonthlyFinancingForDetails() | number }}</span>
                    </div>
                  </div>
                  
                  <!-- Botón de calculadora -->
                  <div class="mt-6">
                    <button 
                      (click)="openCalculatorModal()"
                      class="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-2xl text-sm transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                      </svg>
                      Simulador de crédito
                    </button>
                  </div>
                  
                  <!-- Aviso importante -->
                  <div class="mt-4 p-3 bg-gray-50 rounded-xl border-l-4 border-yellow-400">
                    <p class="text-xs text-gray-600 leading-relaxed">
                      <strong class="text-gray-600">Importante:</strong> Los montos mostrados son una aproximación y no constituyen una oferta final ya que esta puede cambiar de acuerdo a tu historial crediticio, enganche y tasa vigente. Crédito sujeto a términos y condiciones de las instituciones financieras otorgantes.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Botones de acción -->
              <div class="bg-white rounded-3xl p-6 shadow-sm">
                <div class="space-y-4">
                  <button 
                    (click)="openFinancingModal()"
                    class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14H5c-.55 0-1-.45-1-1V8h16v9c0 .55-.45 1-1 1z"/>
                    </svg>
                    Solicitar financiamiento
                  </button>
                  
                  <button 
                    (click)="openWhatsAppModal()"
                    class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
                    </svg>
                    WhatsApp
                  </button>
                  
                  <button 
                    (click)="openTestDriveModal()"
                    class="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                    </svg>
                    Agendar prueba de manejo
                  </button>
                  
                  <button 
                    (click)="openOfferModal()"
                    class="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-bold py-4 px-6 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Haz una oferta
                  </button>
                </div>
              </div>

              <!-- Información del showroom -->
              <div class="bg-white rounded-3xl p-6 shadow-sm">
                <h4 class="font-bold text-gray-900 mb-4">Showroom ABCars</h4>
                <div class="space-y-3 text-sm text-gray-600">
                  <div class="flex items-center space-x-2" *ngIf="vehicle?.location || vehicle?.apiData?.dealership?.location">
                    <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <span>{{ capitalizeFirst(vehicle.location || vehicle.apiData?.dealership?.location || '') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Loading state -->
      <div *ngIf="!vehicle" class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p class="text-xl text-gray-600">Cargando información del vehículo...</p>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <app-modern-footer></app-modern-footer>

    <!-- Modal de Financiamiento -->
    <div 
      *ngIf="showFinancingModal" 
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      (click)="closeFinancingModal()"
    >
      <div class="bg-white rounded-3xl max-w-md w-full mx-4 my-8 max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between p-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <h3 class="text-xl font-bold text-gray-900">Solicitar Financiamiento</h3>
          <button 
            (click)="closeFinancingModal()"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="overflow-y-auto px-6 py-4 flex-1">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input 
                type="text" 
                [(ngModel)]="financingFormData.name"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tu nombre"
                required
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
              <input 
                type="text" 
                [(ngModel)]="financingFormData.last_name"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tus apellidos"
                required
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
              <input 
                type="tel" 
                [(ngModel)]="financingFormData.phone"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tu número de teléfono"
                required
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input 
                type="email" 
                [(ngModel)]="financingFormData.email"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tu@email.com"
                required
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Sucursal *</label>
              <select 
                [(ngModel)]="financingFormData.city"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecciona sucursal</option>
                <option *ngFor="let dealership of dealerships" [value]="dealership.name">{{ dealership.name | titlecase }}<ng-container *ngIf="dealership.location"> — {{ dealership.location | titlecase }}</ng-container></option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Monto de enganche</label>
              <select 
                [(ngModel)]="financingFormData.down_payment_percentage"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option [value]="20">20% - MXN {{ getDownPaymentByPercentage(20) | number }}</option>
                <option [value]="30">30% - MXN {{ getDownPaymentByPercentage(30) | number }}</option>
                <option [value]="40">40% - MXN {{ getDownPaymentByPercentage(40) | number }}</option>
                <option [value]="50">50% - MXN {{ getDownPaymentByPercentage(50) | number }}</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Plazo de financiamiento</label>
              <select 
                [(ngModel)]="financingFormData.term_months"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option *ngFor="let term of getAvailableTermsByYear(vehicle?.year || 0)" [value]="term">
                  {{ term }} meses
                </option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="p-6 pt-4 border-t border-gray-200 flex-shrink-0">
          <button 
            (click)="submitFinancingRequest()"
            [disabled]="isSubmitting"
            class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span *ngIf="!isSubmitting">Solicitar financiamiento</span>
            <span *ngIf="isSubmitting">Enviando...</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de WhatsApp -->
    <div 
      *ngIf="showWhatsAppModal" 
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      (click)="closeWhatsAppModal()"
    >
      <div class="bg-white rounded-3xl p-6 max-w-md w-full mx-4 my-8" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">Contactar por WhatsApp</h3>
          <button 
            (click)="closeWhatsAppModal()"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="space-y-4">
          <div class="text-center">
            <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
              </svg>
            </div>
            <p class="text-gray-600 mb-4">¿Te gustaría contactar con un asesor por WhatsApp?</p>
          </div>
          
          <div class="space-y-3">
            <button 
              (click)="openWhatsApp()"
              class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
              </svg>
              Abrir WhatsApp
            </button>
            
            <button 
              (click)="closeWhatsAppModal()"
              class="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-bold py-3 px-6 rounded-xl text-base transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Prueba de Manejo -->
    <div 
      *ngIf="showTestDriveModal" 
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      (click)="closeTestDriveModal()"
    >
      <div class="bg-white rounded-3xl max-w-md w-full mx-4 my-8 max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between p-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <h3 class="text-xl font-bold text-gray-900">Agendar Prueba de Manejo</h3>
          <button 
            (click)="closeTestDriveModal()"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="overflow-y-auto px-6 py-4 flex-1">
          <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input 
              type="text" 
              [(ngModel)]="testDriveFormData.name"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Tu nombre"
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
            <input 
              type="text" 
              [(ngModel)]="testDriveFormData.last_name"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Tus apellidos"
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
            <input 
              type="tel" 
              [(ngModel)]="testDriveFormData.phone"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Tu número de teléfono"
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input 
              type="email" 
              [(ngModel)]="testDriveFormData.email"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="tu@email.com"
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sucursal *</label>
            <select 
              [(ngModel)]="testDriveFormData.city"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
            >
              <option value="">Selecciona sucursal</option>
              <option *ngFor="let dealership of dealerships" [value]="dealership.name">{{ dealership.name | titlecase }}<ng-container *ngIf="dealership.location"> — {{ dealership.location | titlecase }}</ng-container></option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha preferida</label>
            <input 
              type="date" 
              [(ngModel)]="testDriveFormData.preferred_date"
              [min]="getTodayDate()"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Hora preferida</label>
            <select 
              [(ngModel)]="testDriveFormData.preferred_time"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">Selecciona una hora</option>
              <option value="9:00 AM">9:00 AM</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="12:00 PM">12:00 PM</option>
              <option value="1:00 PM">1:00 PM</option>
              <option value="2:00 PM">2:00 PM</option>
              <option value="3:00 PM">3:00 PM</option>
              <option value="4:00 PM">4:00 PM</option>
              <option value="5:00 PM">5:00 PM</option>
              <option value="6:00 PM">6:00 PM</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Comentarios adicionales</label>
            <textarea 
              [(ngModel)]="testDriveFormData.comments"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" 
              rows="2" 
              placeholder="Algún comentario especial..."
            ></textarea>
          </div>
          </div>
        </div>
        
        <div class="p-6 pt-4 border-t border-gray-200 flex-shrink-0">
          <button 
            (click)="submitTestDrive()"
            [disabled]="isSubmitting"
            class="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-xl text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span *ngIf="!isSubmitting">Agendar prueba de manejo</span>
            <span *ngIf="isSubmitting">Enviando...</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Oferta -->
    <div 
      *ngIf="showOfferModal" 
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      (click)="closeOfferModal()"
    >
      <div class="bg-white rounded-3xl max-w-md w-full mx-4 my-8 max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between p-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <h3 class="text-xl font-bold text-gray-900">Tu oferta de contado</h3>
          <button 
            (click)="closeOfferModal()"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="overflow-y-auto px-6 py-4 flex-1">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input 
                type="text" 
                [(ngModel)]="offerFormData.name"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Tu nombre"
                required
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
              <input 
                type="text" 
                [(ngModel)]="offerFormData.last_name"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Tus apellidos"
                required
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
              <input 
                type="tel" 
                [(ngModel)]="offerFormData.phone"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input 
                type="email" 
                [(ngModel)]="offerFormData.email"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Sucursal *</label>
              <select
                [(ngModel)]="offerFormData.city"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Selecciona sucursal</option>
                <option *ngFor="let dealership of dealerships" [value]="dealership.name">{{ dealership.name | titlecase }}<ng-container *ngIf="dealership.location"> — {{ dealership.location | titlecase }}</ng-container></option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Monto ofrecido (MXN) *</label>
              <input 
                type="number" 
                [(ngModel)]="offerFormData.offer_amount"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                placeholder="Ej: 850000"
                required
              >
            </div>
            
            <!-- <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Condiciones de pago</label>
              <select 
                [(ngModel)]="offerFormData.payment_conditions"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecciona condiciones</option>
                <option value="Contado">Contado</option>
                <option value="Financiamiento">Financiamiento</option>
                <option value="Leasing">Leasing</option>
              </select>
            </div> -->
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Comentarios</label>
              <textarea 
                [(ngModel)]="offerFormData.comments"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                rows="2" 
                placeholder="Condiciones especiales, plazo de respuesta..."
              ></textarea>
            </div>
          </div>
        </div>
        
        <div class="p-6 pt-4 border-t border-gray-200 flex-shrink-0">
          <button 
            (click)="submitOffer()"
            [disabled]="isSubmitting"
            class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span *ngIf="!isSubmitting">Enviar oferta</span>
            <span *ngIf="isSubmitting">Enviando...</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Calculadora Interactiva -->
    <div 
      *ngIf="showCalculatorModal" 
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      (click)="closeCalculatorModal()"
    >
      <div class="bg-white rounded-3xl p-8 max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold text-gray-900">Simulador de crédito</h3>
          <button 
            (click)="closeCalculatorModal()"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Panel de configuración -->
          <div class="space-y-6">
            <h4 class="text-xl font-semibold text-gray-900">Configuración del Financiamiento</h4>
            
            <!-- Precio del vehículo -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Precio del Vehículo (MXN)</label>
              <input 
                type="number" 
                [(ngModel)]="calculatorData.vehiclePrice"
                (ngModelChange)="updateFinanceAmount()"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                placeholder="Ingresa el precio"
              >
            </div>

            <!-- Enganche por porcentaje -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Enganche: {{ calculatorData.downPaymentPercentage }}% 
                <span class="text-sm text-gray-500">({{ getMinDownPayment() | number }} - {{ getMaxDownPayment() | number }} MXN)</span>
              </label>
              <input 
                type="range" 
                [(ngModel)]="calculatorData.downPaymentPercentage"
                (ngModelChange)="updateDownPaymentPercentage()"
                [min]="10"
                [max]="80"
                step="1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              >
              <div class="flex justify-between text-sm text-gray-500 mt-1">
                <span>10%</span>
                <span>80%</span>
              </div>
            </div>

            <!-- Enganche por monto -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Monto de Enganche (MXN)</label>
              <input 
                type="number" 
                [(ngModel)]="calculatorData.downPaymentAmount"
                (ngModelChange)="updateDownPaymentAmount()"
                [min]="getMinDownPayment()"
                [max]="getMaxDownPayment()"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingresa el monto"
              >
            </div>

            <!-- Plazo de financiamiento -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Plazo de Financiamiento</label>
              <select 
                [(ngModel)]="calculatorData.selectedTerm"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option *ngFor="let term of calculatorData.availableTerms" [value]="term">
                  {{ term }} meses
                </option>
              </select>
            </div>

          </div>

          <!-- Panel de resultados -->
          <div class="space-y-6">
            <h4 class="text-xl font-semibold text-gray-900">Resultados del Financiamiento</h4>
            
            <!-- Resumen de cálculos -->
            <div class="bg-gray-50 rounded-2xl p-6 space-y-4">
              <div class="flex justify-between items-center py-2 border-b border-gray-200">
                <span class="text-gray-600">Precio del Vehículo</span>
                <span class="font-bold text-gray-900">MXN {{ calculatorData.vehiclePrice | number }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-200">
                <span class="text-gray-600">Enganche ({{ calculatorData.downPaymentPercentage }}%)</span>
                <span class="font-bold text-gray-900">MXN {{ calculatorData.downPaymentAmount | number }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-200">
                <span class="text-gray-600">Saldo a Financiar</span>
                <span class="font-bold text-gray-900">MXN {{ calculatorData.financeAmount | number }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-200">
                <span class="text-gray-600">Apertura de Crédito</span>
                <span class="font-bold text-gray-900">MXN {{ calculatorData.creditOpeningFeeAmount | number }}</span>
              </div>
            </div>

              <!-- Aviso importante -->
            <div class="mt-6 p-4 bg-gray-50 rounded-xl border-l-4 border-yellow-400">
              <p class="text-xs text-gray-600 leading-relaxed">
                <strong class="text-gray-700">Importante:</strong> Los montos mostrados son una aproximación y no constituyen una oferta final ya que esta puede cambiar de acuerdo a tu historial crediticio, enganche y tasa vigente. Crédito sujeto a términos y condiciones de las instituciones financieras otorgantes.
              </p>
            </div>

            <!-- Mensualidades -->
            <div class="bg-blue-50 rounded-2xl p-6">
              <h5 class="font-semibold text-gray-900 mb-4">Mensualidades</h5>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Pago Fijo ({{ calculatorData.selectedTerm }} meses)</span>
                  <span class="font-bold text-xl text-gray-900">MXN {{ calculateInteractiveMonthlyPayment() | number }}</span>
                </div>
              </div>
            </div>


            <!-- Botones de acción -->
            <div class="space-y-3">
              <button 
                (click)="openFinancingFormFromCalculator()"
                class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Solicitar financiamiento similar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <div 
      *ngIf="showLightbox" 
      class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      (click)="closeLightbox()"
    >
      <div class="relative max-w-7xl max-h-full">
        <!-- Imagen del lightbox -->
        <img 
          *ngIf="mediaItems[selectedMediaIndex]?.type === 'image'"
          [src]="mediaItems[selectedMediaIndex].url" 
          [alt]="mediaItems[selectedMediaIndex].title"
          class="max-w-full max-h-full object-contain"
          (click)="$event.stopPropagation()"
        />
        
        <!-- Video del lightbox -->
        <div 
          *ngIf="mediaItems[selectedMediaIndex]?.type === 'video'"
          class="max-w-full max-h-full bg-black rounded-lg overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <video 
            [src]="mediaItems[selectedMediaIndex].url"
            class="max-w-full max-h-full object-contain"
            controls
            autoplay
          >
            Tu navegador no soporta videos HTML5.
          </video>
        </div>
        
        <!-- Vista 360 del lightbox -->
        <div 
          *ngIf="mediaItems[selectedMediaIndex]?.type === 'view360'"
          class="max-w-full max-h-full bg-gray-100 rounded-lg overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <iframe 
            [src]="mediaItems[selectedMediaIndex].url"
            class="w-full h-full border-0"
            allowfullscreen
          ></iframe>
        </div>
        
        <!-- Botones de navegación del lightbox -->
        <button 
          (click)="previousImage(); $event.stopPropagation()"
          class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-all duration-300 backdrop-blur-sm"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        
        <button 
          (click)="nextImage(); $event.stopPropagation()"
          class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-all duration-300 backdrop-blur-sm"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>

        <!-- Botón de cerrar -->
        <button 
          (click)="closeLightbox()"
          class="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        <!-- Indicador de media -->
        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-lg backdrop-blur-sm">
          {{ selectedMediaIndex + 1 }} / {{ mediaItems.length }}
          <span class="ml-2 text-sm opacity-75">
            {{ mediaItems[selectedMediaIndex].type === 'image' ? 'Imagen' : 
               mediaItems[selectedMediaIndex].type === 'video' ? 'Video' : 'Vista 360°' }}
          </span>
        </div>

        <!-- Miniaturas en el lightbox -->
        <div class="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          <div class="flex gap-2 bg-black/30 backdrop-blur-sm p-2 rounded-lg">
            <div 
              *ngFor="let media of mediaItems; let i = index"
              (click)="selectMedia(i); $event.stopPropagation()"
              class="cursor-pointer transition-all duration-300 hover:opacity-80 relative"
              [class.opacity-100]="i === selectedMediaIndex"
              [class.opacity-60]="i !== selectedMediaIndex"
            >
              <!-- Thumbnail de imagen -->
              <img 
                *ngIf="media.type === 'image'"
                [src]="media.thumbnail" 
                [alt]="media.title"
                class="w-16 h-12 object-cover rounded border-2 transition-all duration-300"
                [class.border-yellow-500]="i === selectedMediaIndex"
                [class.border-white]="i !== selectedMediaIndex"
              />
              
              <!-- Thumbnail de video -->
              <div 
                *ngIf="media.type === 'video'"
                class="w-16 h-12 bg-black rounded border-2 transition-all duration-300 flex items-center justify-center relative overflow-hidden"
                [class.border-yellow-500]="i === selectedMediaIndex"
                [class.border-white]="i !== selectedMediaIndex"
              >
                <img 
                  [src]="media.thumbnail" 
                  [alt]="media.title"
                  class="w-full h-full object-cover opacity-60"
                />
                <div class="absolute inset-0 flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              
              <!-- Thumbnail de vista 360 -->
              <div 
                *ngIf="media.type === 'view360'"
                class="w-16 h-12 bg-gray-200 rounded border-2 transition-all duration-300 flex items-center justify-center relative overflow-hidden"
                [class.border-yellow-500]="i === selectedMediaIndex"
                [class.border-white]="i !== selectedMediaIndex"
              >
                <img 
                  [src]="media.thumbnail" 
                  [alt]="media.title"
                  class="w-full h-full object-cover opacity-60"
                />
                <div class="absolute inset-0 flex items-center justify-center">
                  <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Solicitud de Financiamiento - Step by Step -->
    <div 
      *ngIf="showFinancingRequestModal" 
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      (click)="closeFinancingRequestModal()"
    >
      <div class="bg-white rounded-3xl p-8 max-w-3xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <!-- Header con indicador de pasos -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-2xl font-bold text-gray-900">Solicitar Financiamiento</h3>
            <p class="text-gray-600">Paso {{ financingRequestStep }} de {{ totalFinancingSteps }}</p>
          </div>
          <button 
            (click)="closeFinancingRequestModal()"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Indicador de progreso -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div 
              *ngFor="let step of [1, 2, 3]; let i = index"
              class="flex items-center"
            >
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors cursor-pointer"
                [class.bg-blue-500]="financingRequestStep >= step"
                [class.text-white]="financingRequestStep >= step"
                [class.bg-gray-200]="financingRequestStep < step"
                [class.text-gray-500]="financingRequestStep < step"
                (click)="goToFinancingStep(step)"
              >
                {{ step }}
              </div>
              <div 
                *ngIf="i < 2"
                class="w-16 h-1 mx-2 transition-colors"
                [class.bg-blue-500]="financingRequestStep > step"
                [class.bg-gray-200]="financingRequestStep <= step"
              ></div>
            </div>
          </div>
          <div class="flex justify-between mt-2 text-xs text-gray-500">
            <span>Información personal</span>
            <span>Datos financieros</span>
            <span>Confirmación</span>
          </div>
        </div>

        <!-- Paso 1: Información personal -->
        <div *ngIf="financingRequestStep === 1" class="space-y-6">
          <div class="bg-blue-50 rounded-2xl p-6 mb-6">
            <h4 class="font-semibold text-gray-900 mb-4">Resumen de tu Financiamiento</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Vehículo:</span>
                <span class="font-semibold"><span class="uppercase">{{ vehicle?.brand }}</span> {{ vehicle?.model }} {{ vehicle?.year }}</span>
              </div>
              <div class="flex justify-between">
                <span>Precio:</span>
                <span class="font-semibold">MXN {{ vehicle?.price | number }}</span>
              </div>
              <div class="flex justify-between">
                <span>Enganche ({{ getFinancingDownPaymentPercentage() }}%):</span>
                <span class="font-semibold">MXN {{ getFinancingDownPayment() | number }}</span>
              </div>
              <div class="flex justify-between">
                <span>Pago desde · Mensualidad ({{ getFinancingSelectedTerm() }} meses):</span>
                <span class="font-semibold text-blue-600">MXN {{ getFinancingMonthlyPayment() | number }}</span>
              </div>
            </div>
          </div>

          <h4 class="text-lg font-semibold text-gray-900 mb-4">Información Personal</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
              <input 
                type="text" 
                [(ngModel)]="financingFormData.name"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tu nombre"
                required
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Apellidos *</label>
              <input 
                type="text" 
                [(ngModel)]="financingFormData.last_name"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tus apellidos"
                required
              >
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
              <input 
                type="tel" 
                [(ngModel)]="financingFormData.phone"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tu número de teléfono"
                required
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Sucursal *</label>
              <select 
                [(ngModel)]="financingFormData.city"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecciona sucursal</option>
                <option *ngFor="let dealership of dealerships" [value]="dealership.name">{{ dealership.name | titlecase }}<ng-container *ngIf="dealership.location"> — {{ dealership.location | titlecase }}</ng-container></option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Correo electrónico *</label>
            <input 
              type="email" 
              [(ngModel)]="financingFormData.email"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tu@email.com"
              required
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Dirección *</label>
            <textarea 
              [(ngModel)]="financingFormData.address"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Tu dirección completa"
              required
            ></textarea>
          </div>
        </div>

        <!-- Paso 2: Datos financieros -->
        <div *ngIf="financingRequestStep === 2" class="space-y-6">
          <h4 class="text-lg font-semibold text-gray-900 mb-4">Información Financiera</h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Ocupación *</label>
              <select [(ngModel)]="financingFormData.occupation" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                <option value="">Selecciona tu ocupación</option>
                <option value="empleado">Empleado</option>
                <option value="empresario">Empresario</option>
                <option value="profesionista">Profesionista independiente</option>
                <option value="comerciante">Comerciante</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Ingresos mensuales *</label>
              <select [(ngModel)]="financingFormData.monthly_income" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                <option value="">Selecciona tu rango de ingresos</option>
                <option value="0-15000">$0 - $15,000</option>
                <option value="15000-25000">$15,000 - $25,000</option>
                <option value="25000-40000">$25,000 - $40,000</option>
                <option value="40000-60000">$40,000 - $60,000</option>
                <option value="60000+">$60,000+</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Empresa donde trabajas</label>
              <input 
                type="text" 
                [(ngModel)]="financingFormData.company"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre de la empresa"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Antigüedad en el trabajo</label>
              <select [(ngModel)]="financingFormData.job_tenure" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Selecciona antigüedad</option>
                <option value="0-6">0 - 6 meses</option>
                <option value="6-12">6 - 12 meses</option>
                <option value="1-2">1 - 2 años</option>
                <option value="2-5">2 - 5 años</option>
                <option value="5+">5+ años</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Comentarios adicionales</label>
            <textarea 
              [(ngModel)]="financingFormData.comments"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
              placeholder="Cuéntanos más sobre tu situación financiera o cualquier pregunta que tengas..."
            ></textarea>
          </div>
        </div>

        <!-- Paso 3: Confirmación -->
        <div *ngIf="financingRequestStep === 3" class="space-y-6">
          <h4 class="text-lg font-semibold text-gray-900 mb-4">Confirmación y Términos</h4>
          
          <div class="bg-green-50 rounded-2xl p-6 mb-6">
            <div class="flex items-center mb-4">
              <svg class="w-8 h-8 text-green-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <h5 class="text-lg font-semibold text-gray-900">¡Casi terminamos!</h5>
            </div>
            <p class="text-gray-600 mb-4">Revisa la información de tu solicitud de financiamiento y confirma que todo esté correcto.</p>
            
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Vehículo:</span>
                <span class="font-semibold"><span class="uppercase">{{ vehicle?.brand }}</span> {{ vehicle?.model }} {{ vehicle?.year }}</span>
              </div>
              <div class="flex justify-between">
                <span>Pago desde · Mensualidad:</span>
                <span class="font-semibold text-green-600">MXN {{ getFinancingMonthlyPayment() | number }}</span>
              </div>
              <div class="flex justify-between">
                <span>Plazo:</span>
                <span class="font-semibold">{{ getFinancingSelectedTerm() }} meses</span>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <input type="checkbox" id="financing-terms" [(ngModel)]="termsAccepted" class="mt-1" required>
              <label for="financing-terms" class="text-sm text-gray-600">
                Acepto los <a href="#" class="text-blue-600 hover:underline">términos y condiciones</a> del financiamiento.
              </label>
            </div>
            
            <div class="flex items-start gap-3">
              <input type="checkbox" id="financing-privacy" [(ngModel)]="privacyAccepted" class="mt-1" required>
              <label for="financing-privacy" class="text-sm text-gray-600">
                Autorizo el uso de mis datos personales para el procesamiento de mi solicitud de financiamiento.
              </label>
            </div>
            
            <div class="flex items-start gap-3">
              <input type="checkbox" id="financing-contact" [(ngModel)]="contactAccepted" class="mt-1" required>
              <label for="financing-contact" class="text-sm text-gray-600">
                Autorizo que me contacten por teléfono, email o WhatsApp para dar seguimiento a mi solicitud.
              </label>
            </div>
          </div>
        </div>

        <!-- Botones de navegación -->
        <div class="flex justify-between pt-6 border-t border-gray-200">
          <button 
            *ngIf="financingRequestStep > 1"
            type="button"
            (click)="previousFinancingStep()"
            class="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-bold rounded-xl transition-colors"
          >
            Anterior
          </button>
          <div *ngIf="financingRequestStep === 1" class="w-24"></div>

          <button 
            *ngIf="financingRequestStep < totalFinancingSteps"
            type="button"
            (click)="nextFinancingStep()"
            class="ml-auto px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors"
          >
            Siguiente
          </button>

          <button 
            *ngIf="financingRequestStep === totalFinancingSteps"
            type="button"
            (click)="submitFinancingRequest()"
            [disabled]="isSubmitting"
            class="ml-auto px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span *ngIf="!isSubmitting">Enviar Solicitud</span>
            <span *ngIf="isSubmitting">Enviando...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    /* Estilos para la galería */
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }

    /* Animaciones para el lightbox */
    .lightbox-enter {
      animation: fadeIn 0.3s ease-out;
    }

    .lightbox-exit {
      animation: fadeOut 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    /* Mejoras para móviles */
    @media (max-width: 768px) {
      .gallery-main-image {
        height: 300px;
      }
      
      .gallery-thumbnails {
        padding: 0.5rem;
      }
      
      .gallery-thumbnail {
        width: 60px;
        height: 48px;
      }
      
      .lightbox-controls {
        padding: 0.75rem;
      }
      
      .lightbox-thumbnails {
        bottom: 1rem;
      }
      
      .lightbox-thumbnail {
        width: 48px;
        height: 36px;
      }
    }

    /* Gestos táctiles para móviles */
    .gallery-container {
      touch-action: pan-y pinch-zoom;
    }

    /* Mejoras de accesibilidad */
    .gallery-button:focus {
      outline: 2px solid #f59e0b;
      outline-offset: 2px;
    }

    /* Transiciones suaves */
    .gallery-transition {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Estilos para sliders */
    .slider {
      -webkit-appearance: none;
      appearance: none;
      background: #e5e7eb;
      outline: none;
      border-radius: 0.5rem;
    }

    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      background: #3b82f6;
      cursor: pointer;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      background: #3b82f6;
      cursor: pointer;
      border-radius: 50%;
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    /* Animaciones para el modal */
    .modal-enter {
      animation: modalFadeIn 0.3s ease-out;
    }

    @keyframes modalFadeIn {
      from { 
        opacity: 0; 
        transform: scale(0.95) translateY(-20px);
      }
      to { 
        opacity: 1; 
        transform: scale(1) translateY(0);
      }
    }

    /* Responsive para el modal */
    @media (max-width: 768px) {
      .modal-content {
        margin: 1rem;
        max-height: calc(100vh - 2rem);
      }
    }
  `]
})
export class VehicleDetailComponent implements OnInit {
  vehicle: Vehicle | null = null;
  vehicleId: string | null = null;
  
  // Propiedades para la galería
  selectedMediaIndex = 0;
  showLightbox = false;
  mediaItems: MediaItem[] = [];

  // Estados de acordeones para móvil
  isSpecsOpen = false;
  isEquipmentOpen = false;
  isHistoryOpen = false;

  // Propiedades para los modales
  showFinancingModal = false;
  showWhatsAppModal = false;
  showTestDriveModal = false;
  showOfferModal = false;
  showCalculatorModal = false;
  
  // Modal de solicitud de financiamiento
  showFinancingRequestModal = false;
  
  // Pasos del formulario de financiamiento
  financingRequestStep = 1;
  totalFinancingSteps = 3;

  // Propiedades para la calculadora interactiva
  calculatorData = {
    vehiclePrice: 0,
    downPaymentPercentage: 30,
    downPaymentAmount: 0,
    financeAmount: 0,
    monthlyInterestRate: 1.5,
    creditOpeningFeePercentage: 3,
    creditOpeningFeeAmount: 0,
    selectedTerm: 24,
    availableTerms: [6, 12, 18, 24, 30, 36, 48, 60]
  };

  // Datos de ejemplo para simular la base de datos
  private vehicles: Vehicle[] = [
    { 
      uuid: '1',
      id: 1, 
      brand: 'BMW', 
      model: 'X5 M Competition', 
      year: 2021, 
      price: 1850000, 
      mileage: 36035, 
      fuel: 'Gasolina', 
      transmission: 'Automático', 
      status: 'premium', 
      certification: 'Premium',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      view360_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.2156!2d-74.00369368459373!3d40.74844097932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ0JzU0LjQiTiA3NMKwMDAnMTMuMyJX!5e0!3m2!1sen!2sus!4v1234567890'
    },
    { 
      uuid: '2',
      id: 2, 
      brand: 'Mercedes-Benz', 
      model: 'C300 e AMG Line', 
      year: 2022, 
      price: 890000, 
      mileage: 64300, 
      fuel: 'Híbrido', 
      transmission: 'Automático', 
      status: 'active', 
      certification: 'Eco-friendly',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      view360_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.2156!2d-74.00369368459373!3d40.74844097932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ0JzU0LjQiTiA3NMKwMDAnMTMuMyJX!5e0!3m2!1sen!2sus!4v1234567890'
    },
    { 
      uuid: '3',
      id: 3, 
      brand: 'Porsche', 
      model: '911 GT3', 
      year: 2021, 
      price: 2750000, 
      mileage: 7900, 
      fuel: 'Gasolina', 
      transmission: 'Manual', 
      status: 'premium', 
      certification: 'Premium',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      view360_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.2156!2d-74.00369368459373!3d40.74844097932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ0JzU0LjQiTiA3NMKwMDAnMTMuMyJX!5e0!3m2!1sen!2sus!4v1234567890'
    },
    { 
      uuid: '4',
      id: 4, 
      brand: 'Audi', 
      model: 'RS6 Avant quattro', 
      year: 2020, 
      price: 1650000, 
      mileage: 95600, 
      fuel: 'Gasolina', 
      transmission: 'Automático', 
      status: 'active', 
      certification: 'Certificado',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      view360_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.2156!2d-74.00369368459373!3d40.74844097932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ0JzU0LjQiTiA3NMKwMDAnMTMuMyJX!5e0!3m2!1sen!2sus!4v1234567890'
    },
    { 
      uuid: '5',
      id: 5, 
      brand: 'Chevrolet', 
      model: 'Trax LT', 
      year: 2020, 
      price: 300000, 
      mileage: 63626, 
      fuel: 'Gasolina', 
      transmission: 'Automático', 
      status: 'active', 
      certification: 'Certificado',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      view360_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.2156!2d-74.00369368459373!3d40.74844097932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ0JzU0LjQiTiA3NMKwMDAnMTMuMyJX!5e0!3m2!1sen!2sus!4v1234567890'
    },
    { 
      uuid: '6',
      id: 6, 
      brand: 'Honda', 
      model: 'Civic Sport', 
      year: 2021, 
      price: 420000, 
      mileage: 28500, 
      fuel: 'Gasolina', 
      transmission: 'Manual', 
      status: 'active', 
      certification: 'Certificado',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      view360_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.2156!2d-74.00369368459373!3d40.74844097932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ0JzU0LjQiTiA3NMKwMDAnMTMuMyJX!5e0!3m2!1sen!2sus!4v1234567890'
    },
    { 
      uuid: '7',
      id: 7, 
      brand: 'Toyota', 
      model: 'Camry Hybrid XLE', 
      year: 2023, 
      price: 650000, 
      mileage: 12000, 
      fuel: 'Híbrido', 
      transmission: 'Automático', 
      status: 'active', 
      certification: 'Eco-friendly',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      view360_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.2156!2d-74.00369368459373!3d40.74844097932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ0JzU0LjQiTiA3NMKwMDAnMTMuMyJX!5e0!3m2!1sen!2sus!4v1234567890'
    },
    { 
      uuid: '8',
      id: 8, 
      brand: 'Ford', 
      model: 'Mustang GT Premium', 
      year: 2022, 
      price: 950000, 
      mileage: 18500, 
      fuel: 'Gasolina', 
      transmission: 'Manual', 
      status: 'premium', 
      certification: 'Premium',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      view360_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.2156!2d-74.00369368459373!3d40.74844097932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ0JzU0LjQiTiA3NMKwMDAnMTMuMyJX!5e0!3m2!1sen!2sus!4v1234567890'
    }
  ];

  // Datos de formularios
  financingFormData: any = {};
  testDriveFormData: any = {};
  offerFormData: any = {};
  isSubmitting = false;
  
  // Propiedades para validar casillas del formulario de financiamiento
  termsAccepted = false;
  privacyAccepted = false;
  contactAccepted = false;
  dealerships: Dealership[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private vehicleService: VehicleService,
    private leadService: LeadService,
    private referralService: ReferralService
  ) {}

  ngOnInit() {
    this.referralService.captureFromUrl(this.route);
    this.loadDealerships();
    this.route.params.subscribe(params => {
      this.vehicleId = params['id'];
      this.loadVehicle();
    });
  }

  private loadDealerships(): void {
    this.vehicleService.searchDealerships().subscribe({
      next: (res: DealerShipResponse) => {
        if (res.status === 200 && Array.isArray(res.data)) {
          this.dealerships = res.data;
        }
      },
      error: () => {
        this.dealerships = [];
      }
    });
  }

  loadVehicle() {
    if (this.vehicleId) {
      // Cargar vehículo desde la API usando el UUID
      this.vehicleService.getVehicle(this.vehicleId).subscribe({
        next: (response) => {
          if (response.status === 200 && response.data) {
            const apiVehicle = response.data;
            
            // Mapear datos de la API al formato del componente
            this.vehicle = {
              uuid: apiVehicle.uuid,
              brand: (apiVehicle.brand?.name || 'Sin marca').toUpperCase(),
              model: this.capitalizeFirst(apiVehicle.model?.name || apiVehicle.line?.name || 'Sin modelo'),
              year: apiVehicle.model?.year || new Date().getFullYear(),
              price: apiVehicle.sale_price || apiVehicle.list_price || 0,
              mileage: apiVehicle.mileage || 0,
              fuel: apiVehicle.fuel_type || 'Gasolina',
              transmission: this.formatTransmission(apiVehicle.transmission),
              status: apiVehicle.page_status || 'active',
              name: apiVehicle.name,
              description: apiVehicle.description,
              exterior_color: apiVehicle.exterior_color,
              interior_color: apiVehicle.interior_color,
              cylinders: apiVehicle.cylinders,
              dealership: apiVehicle.dealership?.name,
              location: apiVehicle.dealership?.location,
              video_url: apiVehicle.video_link || undefined,
              apiData: apiVehicle
            };
            
            this.initializeMediaItems();
          } else {
            console.error('No se encontró el vehículo');
            this.router.navigate(['/']);
          }
        },
        error: (error) => {
          console.error('Error al cargar el vehículo:', error);
          // Intentar con vehículos de ejemplo como fallback
          this.vehicle = this.vehicles.find(v => v.id?.toString() === this.vehicleId || v.uuid === this.vehicleId) || null;
          if (!this.vehicle) {
            this.router.navigate(['/']);
          } else {
            this.initializeMediaItems();
          }
        }
      });
    }
  }

  formatTransmission(transmission: string): string {
    const transmissionMap: { [key: string]: string } = {
      'automatic': 'Automático',
      'automatico': 'Automático',
      'manual': 'Manual',
      'cvt': 'CVT',
      'triptronic': 'Triptronic'
    };
    return transmissionMap[transmission?.toLowerCase()] || transmission || 'Automático';
  }

  capitalizeFirst(text: string): string {
    if (!text) return '';
    // Capitalizar cada palabra de la ubicación
    return text.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  initializeMediaItems() {
    if (!this.vehicle) return;
    
    this.mediaItems = [];
    
    console.log('🖼️ [DETAIL] Inicializando galería:', {
      uuid: this.vehicle.uuid,
      hasApiData: !!this.vehicle.apiData,
      imagesCount: this.vehicle.apiData?.images?.length || 0,
      images: this.vehicle.apiData?.images
    });
    
    // Agregar imágenes desde la API
    if (this.vehicle.apiData?.images && this.vehicle.apiData.images.length > 0) {
      console.log('✅ [DETAIL] Usando imágenes de la API');
      this.vehicle.apiData.images.forEach((image, index) => {
        console.log(`🖼️ [DETAIL] Imagen ${index + 1}:`, image.service_image_url);
        this.mediaItems.push({
          type: 'image',
          url: image.service_image_url,
          thumbnail: image.service_image_url,
          title: `${this.vehicle?.brand} ${this.vehicle?.model} - Imagen ${index + 1}`
        });
      });
    } else {
      // Usar imágenes por defecto si no hay en la API
      console.warn('⚠️ [DETAIL] No hay imágenes de la API, usando fallback');
      const images = this.getGalleryImages();
      images.forEach((image, index) => {
        this.mediaItems.push({
          type: 'image',
          url: image,
          thumbnail: image,
          title: `${this.vehicle?.brand} ${this.vehicle?.model} - Imagen ${index + 1}`
        });
      });
    }
    
    // Agregar video si existe
    if (this.vehicle.video_url) {
      this.mediaItems.push({
        type: 'video',
        url: this.vehicle.video_url,
        thumbnail: this.getVehicleImage(),
        title: `Video del ${this.vehicle.brand} ${this.vehicle.model}`
      });
    }
    
    // Agregar vista 360 si existe
    if (this.vehicle.view360_url) {
      this.mediaItems.push({
        type: 'view360',
        url: this.vehicle.view360_url,
        thumbnail: this.getVehicleImage(),
        title: `Vista 360° del ${this.vehicle.brand} ${this.vehicle.model}`
      });
    }
  }

  goBack() {
    this.location.back();
  }

  getVehicleImage(): string {
    if (this.vehicle?.image_url) {
      return this.vehicle.image_url;
    }
    
    const brandImages: { [key: string]: string } = {
      'BMW': FALLBACK_HERO_IMAGE,
      'Mercedes-Benz': FALLBACK_HERO_IMAGE,
      'Mercedes': FALLBACK_HERO_IMAGE,
      'Audi': FALLBACK_HERO_IMAGE,
      'Honda': FALLBACK_HERO_IMAGE,
      'Toyota': FALLBACK_HERO_IMAGE,
      'Chevrolet': FALLBACK_HERO_IMAGE,
      'Porsche': FALLBACK_HERO_IMAGE,
      'Ford': FALLBACK_HERO_IMAGE
    };
    
    return brandImages[this.vehicle?.brand || ''] || FALLBACK_HERO_IMAGE;
  }

  // Método para obtener las imágenes de la galería
  getGalleryImages(): string[] {
    if (!this.vehicle) return [];
    
    const baseImage = this.getVehicleImage();
    const brand = this.vehicle.brand;
    
    // Galería de imágenes según la marca
    const galleryImages: { [key: string]: string[] } = {
      'BMW': [
        baseImage,
        FALLBACK_HERO_IMAGE,
        FALLBACK_HERO_IMAGE,
        FALLBACK_HERO_IMAGE,
        FALLBACK_HERO_IMAGE,
        FALLBACK_HERO_IMAGE
      ],
      'Mercedes-Benz': [
        baseImage,
        FALLBACK_HERO_IMAGE,
        FALLBACK_HERO_IMAGE,
        FALLBACK_HERO_IMAGE,
        FALLBACK_HERO_IMAGE,
        FALLBACK_HERO_IMAGE
      ],
      'Porsche': [
        baseImage,
        FALLBACK_HERO_IMAGE,
        FALLBACK_HERO_IMAGE,
        FALLBACK_HERO_IMAGE,
        FALLBACK_HERO_IMAGE,
        FALLBACK_HERO_IMAGE
      ]
    };
    
    return galleryImages[brand] || [
      baseImage,
      FALLBACK_HERO_IMAGE,
      FALLBACK_HERO_IMAGE,
      FALLBACK_HERO_IMAGE,
      FALLBACK_HERO_IMAGE
    ];
  }

  getEngineInfo(): string {
    if (this.vehicle?.apiData?.version?.name) {
      return this.vehicle.apiData.version.name;
    }
    
    if (this.vehicle?.cylinders) {
      return `${this.vehicle.cylinders} cilindros • ${this.vehicle.transmission}`;
    }
    
    return this.vehicle?.transmission || 'Automático';
  }

  getHighlights(): string[] {
    // NOTA: Campo 'highlights' no existe en la base de datos actualmente
    // TODO: Si se agrega el campo 'highlights' como JSON a la tabla vehicles, descomentar:
    // return this.vehicle?.apiData?.highlights || [];
    
    // Retornar array vacío ya que no existe en BD
    return [];
    
    /* CÓDIGO HARDCODEADO COMENTADO - NO EXISTE EN BD
    const highlights: { [key: string]: string[] } = {
      'BMW': [...],
      'Mercedes-Benz': [...],
      // ... más marcas
    };
    return highlights[this.vehicle?.brand || ''] || [...];
    */
  }

  getSpecifications() {
    const specs = [];
    const apiVehicle = this.vehicle?.apiData;
    const spec = apiVehicle?.specification;

    // Campos existentes en la tabla vehicles
    if (this.vehicle?.year) {
      specs.push({ label: 'Año', value: this.vehicle.year.toString() });
    }
    if (this.vehicle?.mileage !== undefined) {
      specs.push({ label: 'Kilometraje', value: `${this.vehicle.mileage.toLocaleString()} km` });
    }
    if (this.vehicle?.fuel) {
      specs.push({ label: 'Combustible', value: this.getFuelType() });
    }
    if (this.vehicle?.transmission) {
      specs.push({ label: 'Transmisión', value: this.vehicle.transmission });
    }
    if (this.vehicle?.cylinders !== undefined && this.vehicle.cylinders !== null) {
      specs.push({ label: 'Cilindros', value: this.vehicle.cylinders.toString() });
    }
    if (apiVehicle?.engine_displacement_cc != null && apiVehicle.engine_displacement_cc > 0) {
      specs.push({ label: 'Cilindrada', value: `${apiVehicle.engine_displacement_cc} cc` });
    }
    if (apiVehicle?.wet_weight_kg != null && apiVehicle.wet_weight_kg > 0) {
      specs.push({ label: 'Peso en orden de marcha', value: `${apiVehicle.wet_weight_kg} kg` });
    }
    if (this.vehicle?.exterior_color) {
      specs.push({ label: 'Color exterior', value: this.formatColor(this.vehicle.exterior_color) });
    }
    if (this.vehicle?.interior_color) {
      specs.push({ label: 'Color interior', value: this.formatColor(this.vehicle.interior_color) });
    }
    if (this.vehicle?.apiData?.type || this.vehicle?.apiData?.category) {
      specs.push({ label: 'Tipo de vehículo', value: this.formatVehicleType() });
    }
    if (apiVehicle?.body) {
      specs.push({ label: 'Carrocería', value: this.formatBodyType() });
    }
    if (apiVehicle?.drive_train) {
      specs.push({ label: 'Tipo de tracción', value: this.formatColor(apiVehicle.drive_train) });
    }

    // Campos existentes en vehicle_specifications
    // if (spec?.engine_type) {
    //   specs.push({ label: 'Tipo de motor', value: this.formatColor(spec.engine_type) });
    // }
    // if (spec?.country_of_origin) {
    //   specs.push({ label: 'País de origen', value: this.formatColor(spec.country_of_origin) });
    // }
    // if (spec?.intake_engine) {
    //   specs.push({ label: 'Aspiración del motor', value: this.formatColor(spec.intake_engine) });
    // }
    // if (spec?.auto_start_stop) {
    //   specs.push({ label: 'Start-stop', value: spec.auto_start_stop === 'yes' ? 'Sí' : 'No' });
    // }
    // if (spec?.keys_number) {
    //   specs.push({ label: 'Número de llaves', value: spec.keys_number.toString() });
    // }
    // if (spec?.plates) {
    //   specs.push({ label: 'Placas', value: spec.plates });
    // }

    // Campos hardcodeados comentados - NO EXISTEN EN BD
    // { label: 'Peso', value: this.getWeight() },
    // { label: 'Color', value: this.getColor() },
    // { label: 'Airbags', value: this.getAirbags() }

    return specs;
  }

  getFuelType(): string {
    const fuel = this.vehicle?.fuel || this.vehicle?.apiData?.fuel_type || '';
    const fuelTypes: { [key: string]: string } = {
      'gasoline': 'Gasolina',
      'diesel': 'Diésel',
      'hybrid': 'Híbrido',
      'electric': 'Eléctrico',
      'gas': 'Gas LP',
      'Gasolina': 'Gasolina',
      'Diesel': 'Diésel',
      'Híbrido': 'Híbrido',
      'Eléctrico': 'Eléctrico',
      'Gas': 'Gas LP'
    };
    
    return fuelTypes[fuel] || fuel || 'Gasolina';
  }

  // COMENTADO: Campo 'horsepower' no existe en la base de datos
  /* getHorsepower(): string {
    const horsepowers: { [key: string]: string } = {
      'BMW': '625 HP',
      'Mercedes-Benz': '367 HP',
      // ... más marcas
    };
    return horsepowers[this.vehicle?.brand || ''] || '200 HP';
  } */

  // COMENTADO: Campos no existen en la base de datos
  /* getAcceleration(): string { ... } */
  /* getTopSpeed(): string { ... } */
  /* getConsumption(): string { ... } */
  /* getDoors(): string { ... } */
  /* getWeight(): string { ... } */
  /* getColor(): string { ... } */
  /* getAirbags(): string { ... } */

  // Métodos para venta de contado
  getCashPrice(): number {
    return Math.round((this.vehicle?.price || 0) * 0.95); // 5% descuento por pago de contado
  }

  getCashDiscount(): number {
    return Math.round((this.vehicle?.price || 0) * 0.05); // 5% de descuento
  }

  // Métodos para financiamiento
  getDownPayment(): number {
    return Math.round((this.vehicle?.price || 0) * 0.3); // 30% de enganche (como en la captura)
  }

  getDownPaymentByPercentage(percentage: number): number {
    return Math.round((this.vehicle?.price || 0) * (percentage / 100));
  }

  getMonthlyFinancing(): number {
    const price = this.vehicle?.price || 0;
    const downPayment = this.getDownPayment();
    const financeAmount = price - downPayment;
    const monthlyRate = 0.129 / 12; // 12.9% anual / 12 meses
    const months = 48;
    
    // Fórmula de pago mensual: P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = financeAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(monthlyPayment);
  }

  getMonthlyFinancingForDetails(): number {
    // Calcular mensualidad usando la misma lógica que el simulador
    const price = this.vehicle?.price || 0;
    if (price <= 0) return 0;

    // Usar 30% de enganche (valor por defecto en "Detalles del financiamiento")
    const downPaymentPercentage = 30;
    const downPayment = Math.round(price * (downPaymentPercentage / 100));
    const financeAmount = price - downPayment;

    // Obtener el plazo máximo según el año del vehículo
    const months = this.getMaxAvailableTerm(this.vehicle?.year);

    // Calcular tasa anual dinámicamente según el año del vehículo
    // Necesitamos simular el calculatorData para usar getAnnualInterestRate
    const originalDownPaymentPercentage = this.calculatorData.downPaymentPercentage;
    this.calculatorData.downPaymentPercentage = downPaymentPercentage;
    
    const annualRate = this.getAnnualInterestRate();
    const monthlyRate = (annualRate / 12) / 100; // Convertir a decimal mensual
    
    // Restaurar el valor original
    this.calculatorData.downPaymentPercentage = originalDownPaymentPercentage;

    if (financeAmount <= 0 || monthlyRate <= 0 || months <= 0) return 0;

    // Fórmula de pago mensual: P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = financeAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(monthlyPayment);
  }

  calculateMonthlyPaymentForForm(downPaymentPercentage: number, termMonths: number): number {
    const price = this.vehicle?.price || 0;
    if (price <= 0) return 0;

    const downPayment = this.getDownPaymentByPercentage(downPaymentPercentage);
    const financeAmount = price - downPayment;

    // Calcular tasa anual dinámicamente según el año del vehículo
    const originalDownPaymentPercentage = this.calculatorData.downPaymentPercentage;
    this.calculatorData.downPaymentPercentage = downPaymentPercentage;
    
    const annualRate = this.getAnnualInterestRate();
    const monthlyRate = (annualRate / 12) / 100; // Convertir a decimal mensual
    
    // Restaurar el valor original
    this.calculatorData.downPaymentPercentage = originalDownPaymentPercentage;

    if (financeAmount <= 0 || monthlyRate <= 0 || termMonths <= 0) return 0;

    // Fórmula de pago mensual: P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = financeAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
    return Math.round(monthlyPayment);
  }

  getTotalFinancing(): number {
    return this.getDownPayment() + (this.getMonthlyFinancing() * 48);
  }

  // Nuevos métodos para la calculadora de financiamiento
  getFinanceAmount(): number {
    return (this.vehicle?.price || 0) - this.getDownPayment();
  }

  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'No especificada';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }

  buildTestDriveComments(preferredDate: string, preferredTime: string, additionalComments: string): string {
    const dateFormatted = this.formatDate(preferredDate);
    const timeFormatted = preferredTime || 'No especificada';
    
    let comments = `Fecha preferida: ${dateFormatted}, Hora preferida: ${timeFormatted}`;
    
    if (additionalComments && additionalComments.trim()) {
      comments += `. ${additionalComments.trim()}`;
    }
    
    return comments;
  }

  buildOfferComments(offerAmount: number, additionalComments: string): string {
    const amountFormatted = offerAmount ? `$${offerAmount.toLocaleString('es-MX')}` : 'No especificado';
    
    let comments = `Monto ofrecido: ${amountFormatted}`;
    
    if (additionalComments && additionalComments.trim()) {
      comments += `. ${additionalComments.trim()}`;
    }
    
    return comments;
  }

  getCreditOpeningFee(): number {
    return Math.round(this.getFinanceAmount() * 0.03); // 3% de apertura de crédito
  }

  getMonthlyInterestRate(): number {
    // Usar la tasa calculada dinámicamente basada en año y enganche
    return this.getCalculatedMonthlyInterestRate();
  }

  // Calcular mensualidades para diferentes plazos
  calculateMonthlyPayment(months: number): number {
    const financeAmount = this.getFinanceAmount();
    const monthlyRate = this.getMonthlyInterestRate() / 100; // 1.5% mensual
    
    // Fórmula de pago mensual: P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = financeAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(monthlyPayment);
  }

  // Calcular mensualidad con descuento por pago puntual
  calculateMonthlyPaymentWithDiscount(months: number): number {
    return this.calculateMonthlyPayment(months) - 300; // Menos $300 por pago puntual
  }

  // Obtener tabla de financiamiento
  getFinancingTable() {
    const terms = [6, 12, 18, 24, 30];
    return terms.map(term => ({
      months: term,
      fixedPayment: this.calculateMonthlyPayment(term),
      discountedPayment: this.calculateMonthlyPaymentWithDiscount(term)
    }));
  }

  // Métodos para la calculadora interactiva
  getAvailableTermsByYear(year: number): number[] {
    if (!year) {
      // Si no hay año, devolver términos por defecto
      return [12, 24, 36, 48, 60];
    }

    // if (year === 2016) {
    //   return [12];
    // } else if (year === 2017) {
    //   return [12, 24];
    // } else if (year === 2018) {
    //   return [12, 24, 36];
    // } else if (year === 2019) {
    //   return [12, 24, 36, 48];
    // } else if (year >= 2020 && year <= 2026) {
    //   return [12, 24, 36, 48, 60];
    // } else {
      // Para años fuera del rango, devolver términos por defecto
    //   return [12, 24, 36, 48, 60];
    // }
    
    if (year === 2017) {
      return [12];
    } else if (year === 2018) {
      return [12, 24];
    } else if (year === 2019) {
      return [12, 24, 36];
    } else if (year === 2020) {
      return [12, 24, 36, 48];
    } else if (year >= 2021 && year <= 2027) {
      return [12, 24, 36, 48, 60];
    } else {
      // Para años fuera del rango, devolver términos por defecto
      return [12, 24, 36, 48, 60];
    }
  }

  getMaxAvailableTerm(year: number | undefined): number {
    const availableTerms = this.getAvailableTermsByYear(year || 0);
    // Devolver el último término (el máximo)
    return availableTerms[availableTerms.length - 1];
  }

  // Métodos para obtener valores del simulador o valores por defecto
  getFinancingDownPaymentPercentage(): number {
    // Si el simulador tiene valores válidos, usar el porcentaje del simulador
    if (this.calculatorData.vehiclePrice > 0) {
      return this.calculatorData.downPaymentPercentage;
    }
    // Por defecto, usar 30%
    return 30;
  }

  getFinancingSelectedTerm(): number {
    // Si el simulador tiene valores válidos, usar el plazo del simulador
    if (this.calculatorData.vehiclePrice > 0) {
      return this.calculatorData.selectedTerm;
    }
    // Por defecto, usar el máximo disponible según el año
    return this.getMaxAvailableTerm(this.vehicle?.year);
  }

  getFinancingDownPayment(): number {
    // Si el simulador tiene valores válidos, usar el enganche del simulador
    if (this.calculatorData.vehiclePrice > 0) {
      return this.calculatorData.downPaymentAmount;
    }
    // Por defecto, usar el método original
    return this.getDownPayment();
  }

  getFinancingMonthlyPayment(): number {
    // Si el simulador tiene valores válidos, usar la mensualidad del simulador
    if (this.calculatorData.vehiclePrice > 0) {
      return this.calculateInteractiveMonthlyPayment();
    }
    // Por defecto, calcular con los valores por defecto pero usando el plazo correcto
    const price = this.vehicle?.price || 0;
    const downPaymentPercentage = this.getFinancingDownPaymentPercentage();
    const downPayment = Math.round(price * (downPaymentPercentage / 100));
    const financeAmount = price - downPayment;
    const monthlyRate = 0.129 / 12; // 12.9% anual / 12 meses
    const months = this.getFinancingSelectedTerm();
    
    if (financeAmount <= 0 || months <= 0) return 0;
    
    // Fórmula de pago mensual: P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = financeAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(monthlyPayment);
  }

  initializeCalculator() {
    if (this.vehicle) {
      this.calculatorData.vehiclePrice = this.vehicle.price;
      this.calculatorData.downPaymentAmount = this.vehicle.price * (this.calculatorData.downPaymentPercentage / 100);
      this.calculatorData.financeAmount = this.vehicle.price - this.calculatorData.downPaymentAmount;
      // La apertura de crédito siempre es 3% fijo
      this.calculatorData.creditOpeningFeePercentage = 3;
      this.calculatorData.creditOpeningFeeAmount = this.calculatorData.financeAmount * (this.calculatorData.creditOpeningFeePercentage / 100);
      
      // Actualizar términos disponibles según el año del vehículo
      const availableTerms = this.getAvailableTermsByYear(this.vehicle.year);
      this.calculatorData.availableTerms = availableTerms;
      
      // Ajustar selectedTerm si el valor actual no está en los nuevos términos disponibles
      if (!availableTerms.includes(this.calculatorData.selectedTerm)) {
        // Usar el primer término disponible o el más cercano
        this.calculatorData.selectedTerm = availableTerms[0];
      }
    }
  }

  updateDownPaymentPercentage() {
    this.calculatorData.downPaymentAmount = this.calculatorData.vehiclePrice * (this.calculatorData.downPaymentPercentage / 100);
    this.updateFinanceAmount();
  }

  updateDownPaymentAmount() {
    const percentage = (this.calculatorData.downPaymentAmount / this.calculatorData.vehiclePrice) * 100;
    this.calculatorData.downPaymentPercentage = Math.round(percentage * 100) / 100;
    this.updateFinanceAmount();
  }

  updateFinanceAmount() {
    this.calculatorData.financeAmount = this.calculatorData.vehiclePrice - this.calculatorData.downPaymentAmount;
    // La apertura de crédito siempre es 3% fijo
    this.calculatorData.creditOpeningFeePercentage = 3;
    this.calculatorData.creditOpeningFeeAmount = this.calculatorData.financeAmount * (this.calculatorData.creditOpeningFeePercentage / 100);
  }

  updateCreditOpeningFee() {
    // La apertura de crédito siempre es 3% fijo
    this.calculatorData.creditOpeningFeePercentage = 3;
    this.calculatorData.creditOpeningFeeAmount = this.calculatorData.financeAmount * (this.calculatorData.creditOpeningFeePercentage / 100);
  }

  // Calcular tasa de interés anual basada en año del vehículo y porcentaje de enganche
  getAnnualInterestRate(): number {
    if (!this.vehicle || !this.vehicle.year) {
      // Tasa por defecto si no hay información del vehículo
      return 15.99;
    }

    const year = this.vehicle.year;
    const downPaymentPercentage = this.calculatorData.downPaymentPercentage;

    // Años 2020-2026
    // if (year >= 2020 && year <= 2026) {
    //   if (downPaymentPercentage > 30) {
    //     return 15.99;
    //   } else {
    //     return 16.99;
    //   }
    // }
    
    // Años 2021-2027
    if (year >= 2021 && year <= 2027) {
      if (downPaymentPercentage > 30) {
        return 15.99;
      } else {
        return 16.99;
      }
    }
    
    // Años 2016-2019
    // if (year >= 2016 && year <= 2019) {
    //   if (downPaymentPercentage > 30) {
    //     return 16.99;
    //   } else {
    //     return 17.99;
    //   }
    // }
    
    // Años 2017-2020
    if (year >= 2017 && year <= 2020) {
      if (downPaymentPercentage > 30) {
        return 16.99;
      } else {
        return 17.99;
      }
    }

    // Para otros años, usar tasa por defecto
    return 16.99;
  }

  // Calcular tasa de interés mensual basada en el año y enganche
  getCalculatedMonthlyInterestRate(): number {
    const annualRate = this.getAnnualInterestRate();
    // Convertir tasa anual a mensual
    return annualRate / 12;
  }

  // Calcular mensualidad con datos de la calculadora
  calculateInteractiveMonthlyPayment(months?: number): number {
    const term = months || this.calculatorData.selectedTerm;
    const financeAmount = this.calculatorData.financeAmount;
    // Usar la tasa calculada dinámicamente en lugar de la tasa fija
    const monthlyRate = this.getCalculatedMonthlyInterestRate() / 100;
    
    if (financeAmount <= 0 || monthlyRate <= 0) return 0;
    
    const monthlyPayment = financeAmount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
    return Math.round(monthlyPayment);
  }

  // Calcular mensualidad con descuento
  calculateInteractiveMonthlyPaymentWithDiscount(months?: number): number {
    return this.calculateInteractiveMonthlyPayment(months) - 300;
  }

  // Obtener total a pagar
  getTotalToPay(): number {
    return this.calculatorData.downPaymentAmount + (this.calculateInteractiveMonthlyPayment() * this.calculatorData.selectedTerm);
  }

  // Validaciones
  getMinDownPayment(): number {
    return Math.round(this.calculatorData.vehiclePrice * 0.1); // Mínimo 10%
  }

  getMaxDownPayment(): number {
    return Math.round(this.calculatorData.vehiclePrice * 0.8); // Máximo 80%
  }

  getMinInterestRate(): number {
    return 0.5; // Mínimo 0.5%
  }

  getMaxInterestRate(): number {
    return 5.0; // Máximo 5%
  }

  // Abrir y cerrar modal de calculadora
  openCalculatorModal() {
    this.initializeCalculator();
    this.showCalculatorModal = true;
  }

  closeCalculatorModal() {
    this.showCalculatorModal = false;
  }

  // Métodos para el modal de solicitud de financiamiento
  openFinancingRequestModal() {
    this.showFinancingRequestModal = true;
    this.financingRequestStep = 1; // Empezar desde el paso 1
  }

  // Método para abrir el formulario desde la calculadora
  openFinancingFormFromCalculator() {
    this.showCalculatorModal = false; // Cerrar la calculadora
    this.showFinancingRequestModal = true; // Abrir el formulario
    this.financingRequestStep = 1; // Empezar desde el paso 1
  }

  closeFinancingRequestModal() {
    this.showFinancingRequestModal = false;
    this.showFinancingModal = false; // También cerrar el modal simple si está abierto
    this.financingRequestStep = 1; // Resetear al paso 1
    // Resetear casillas
    this.termsAccepted = false;
    this.privacyAccepted = false;
    this.contactAccepted = false;
  }

  closeFinancingModal() {
    this.showFinancingModal = false;
  }

  // Métodos para manejar los pasos del formulario
  nextFinancingStep() {
    if (this.financingRequestStep < this.totalFinancingSteps) {
      this.financingRequestStep++;
    }
  }

  previousFinancingStep() {
    if (this.financingRequestStep > 1) {
      this.financingRequestStep--;
    }
  }

  goToFinancingStep(step: number) {
    if (step >= 1 && step <= this.totalFinancingSteps) {
      this.financingRequestStep = step;
    }
  }

  // Métodos para las nuevas secciones
  getEquipment(): string[] {
    // NOTA: Campo 'equipment' no existe en la base de datos actualmente
    // TODO: Si se agrega el campo 'equipment' como JSON a la tabla vehicles, descomentar:
    // return this.vehicle?.apiData?.equipment || [];
    
    // Construir equipamiento desde vehicle_specifications si es posible
    const equipment: string[] = [];
    const spec = this.vehicle?.apiData?.specification;
    
    if (spec) {
      // Agregar equipamiento basado en campos booleanos de specification
      if (spec.wheel_locks === 'yes') equipment.push('Seguros de ruedas');
      if (spec.spare_wheel === 'yes') equipment.push('Llanta de refacción');
      if (spec.hydraulic_jack === 'yes') equipment.push('Gato hidráulico');
      if (spec.fire_extinguisher === 'yes') equipment.push('Extintor');
      if (spec.reflectors === 'yes') equipment.push('Reflectores');
      if (spec.jumper_cables === 'yes') equipment.push('Cables para pasar corriente');
      if (spec.tools === 'yes') equipment.push('Herramientas');
      if (spec.antenna === 'yes') equipment.push('Antena');
      if (spec.stud_wrench === 'yes') equipment.push('Desarmador');
      if (spec.security_film === 'yes') equipment.push('Película de seguridad');
      if (spec.warranty_policy === 'yes') equipment.push('Póliza de garantía');
      if (spec.warranty_manual === 'yes') equipment.push('Manual de garantía');
    }
    
    return equipment;
  }

  hasWarranty(): boolean {
    const spec = this.vehicle?.apiData?.specification;
    if (!spec) return false;
    return spec.warranty_policy === 'yes' || spec.warranty_manual === 'yes';
  }

  getWarrantyDescription(): string {
    const spec = this.vehicle?.apiData?.specification;
    if (!spec) return '';
    
    const hasPolicy = spec.warranty_policy === 'yes';
    const hasManual = spec.warranty_manual === 'yes';
    
    if (hasPolicy && hasManual) {
      return 'El vehículo cuenta con póliza de garantía y manual de garantía que cubren componentes principales.';
    } else if (hasPolicy) {
      return 'El vehículo cuenta con póliza de garantía que cubre componentes principales.';
    } else if (hasManual) {
      return 'El vehículo cuenta con manual de garantía que cubre componentes principales.';
    }
    
    return 'El vehículo cuenta con garantía extendida que cubre componentes principales.';
    
    /* CÓDIGO HARDCODEADO COMENTADO - NO EXISTE EN BD
    return [
      'Aire acondicionado automático',
      'Sistema de navegación GPS',
      // ... más equipamiento hardcodeado
    ];
    */
  }


  requestFinancing() {
    console.log('Solicitar financiamiento para:', this.vehicle);
    // Aquí implementarías la lógica para solicitar financiamiento
    const message = `Hola, me interesa el financiamiento para el ${this.vehicle?.brand} ${this.vehicle?.model} ${this.vehicle?.year}. Enganche: MXN ${this.getDownPayment().toLocaleString()}, Mensualidad: MXN ${this.getMonthlyFinancing().toLocaleString()}`;
    const whatsappUrl = `https://wa.me/5217771234567?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  requestCashQuote() {
    console.log('Solicitar cotización de contado para:', this.vehicle);
    // Aquí implementarías la lógica para cotización de contado
    const message = `Hola, me interesa comprar de contado el ${this.vehicle?.brand} ${this.vehicle?.model} ${this.vehicle?.year}. Precio de contado: MXN ${this.getCashPrice().toLocaleString()} (descuento de MXN ${this.getCashDiscount().toLocaleString()})`;
    const whatsappUrl = `https://wa.me/5217771234567?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  contactWhatsApp() {
    const message = `Hola, estoy interesado en el ${this.vehicle?.brand} ${this.vehicle?.model} ${this.vehicle?.year}. Precio: MXN ${this.vehicle?.price.toLocaleString()}. ¿Podrían darme más información sobre opciones de pago?`;
    const whatsappUrl = `https://wa.me/5217771234567?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  scheduleVisit() {
    console.log('Agendar visita para:', this.vehicle);
    // Aquí implementarías la lógica para agendar visita
  }

  // Métodos para abrir modales
  openFinancingModal() {
    // Inicializar valores por defecto para los selects
    if (!this.financingFormData.down_payment_percentage) {
      this.financingFormData.down_payment_percentage = 20; // Primer valor del select (20%)
    }
    if (!this.financingFormData.term_months) {
      const availableTerms = this.getAvailableTermsByYear(this.vehicle?.year || 0);
      this.financingFormData.term_months = availableTerms.length > 0 ? availableTerms[0] : 12; // Primer término disponible
    }
    this.showFinancingModal = true;
  }

  openWhatsAppModal() {
    this.showWhatsAppModal = true;
  }

  openTestDriveModal() {
    this.showTestDriveModal = true;
  }

  openOfferModal() {
    this.showOfferModal = true;
  }

  // Métodos para cerrar modales

  closeWhatsAppModal() {
    this.showWhatsAppModal = false;
  }

  openWhatsApp() {
    // Construir mensaje con información del vehículo si está disponible
    let message = 'Hola ABCars, tengo duda acerca de un auto...';
    
    if (this.vehicle) {
      message = `Hola ABCars, me interesa el ${this.vehicle.brand} ${this.vehicle.model} ${this.vehicle.year}. ¿Podrían darme más información?`;
    }
    
    const whatsappUrl = `https://wa.me/5212221263726?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Opcional: cerrar el modal después de abrir WhatsApp
    this.closeWhatsAppModal();
  }

  closeTestDriveModal() {
    this.showTestDriveModal = false;
  }

  closeOfferModal() {
    this.showOfferModal = false;
  }

  // Métodos para la galería
  selectMedia(index: number) {
    this.selectedMediaIndex = index;
  }

  nextMedia() {
    this.selectedMediaIndex = (this.selectedMediaIndex + 1) % this.mediaItems.length;
  }

  previousMedia() {
    this.selectedMediaIndex = this.selectedMediaIndex === 0 ? this.mediaItems.length - 1 : this.selectedMediaIndex - 1;
  }

  // Métodos de compatibilidad (mantener para el template)
  selectImage(index: number) {
    this.selectMedia(index);
  }

  nextImage() {
    this.nextMedia();
  }

  previousImage() {
    this.previousMedia();
  }

  openLightbox() {
    this.showLightbox = true;
  }

  closeLightbox() {
    this.showLightbox = false;
  }

  // Métodos para acordeones móviles
  toggleSpecs() {
    this.isSpecsOpen = !this.isSpecsOpen;
  }

  toggleEquipment() {
    this.isEquipmentOpen = !this.isEquipmentOpen;
  }

  toggleHistory() {
    this.isHistoryOpen = !this.isHistoryOpen;
  }

  // Manejar teclas en el lightbox
  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    if (this.showLightbox) {
      if (event.key === 'Escape') {
        this.closeLightbox();
      } else if (event.key === 'ArrowRight') {
        this.nextMedia();
      } else if (event.key === 'ArrowLeft') {
        this.previousMedia();
      }
    }
  }

  formatColor(color: string | undefined): string {
    if (!color) return '-';
    return color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
  }

  formatVehicleType(): string {
    const api = this.vehicle?.apiData;
    const typeMap: { [key: string]: string } = {
      car: 'Automóvil',
      moto: 'Motocicletas',
      truck: 'Camión',
      other: 'Otro',
    };
    const categoryMap: { [key: string]: string } = {
      new: 'Nuevo',
      pre_owned: 'Seminuevo',
      demo: 'Demostrador',
    };
    const typeLabel = api?.type ? typeMap[api.type] : '';
    const catLabel = api?.category ? categoryMap[api.category] : '';
    if (typeLabel && catLabel) {
      return `${typeLabel} (${catLabel})`;
    }
    if (typeLabel) {
      return typeLabel;
    }
    if (catLabel) {
      return catLabel;
    }
    return '-';
  }

  formatBodyType(): string {
    const body = this.vehicle?.apiData?.body?.name;
    const bodyMap: { [key: string]: string } = {
      'sedan': 'Sedán',
      'suv': 'SUV',
      'pickup': 'Pick-up',
      'hatchback': 'Hatchback',
      'coupe': 'Coupé',
      'convertible': 'Convertible'
    };
    return bodyMap[body?.toLowerCase() || ''] || body || '-';
  }

  // Métodos para enviar formularios
  submitFinancingRequest() {
    console.log('submitFinancingRequest llamado', this.financingFormData);
    
    if (this.isSubmitting) {
      console.log('Ya se está enviando, ignorando...');
      return;
    }

    // Validar campos requeridos básicos
    if (!this.financingFormData.name || !this.financingFormData.last_name || !this.financingFormData.phone || !this.financingFormData.email || !this.financingFormData.city) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor, completa al menos nombre, apellidos, teléfono, email y sucursal.',
      });
      return;
    }

    // Validar que las casillas estén marcadas
    if (!this.termsAccepted || !this.privacyAccepted || !this.contactAccepted) {
      const missingCheckboxes = [];
      if (!this.termsAccepted) missingCheckboxes.push('términos y condiciones');
      if (!this.privacyAccepted) missingCheckboxes.push('autorización de datos personales');
      if (!this.contactAccepted) missingCheckboxes.push('autorización de contacto');
      
      Swal.fire({
        icon: 'warning',
        title: 'Casillas requeridas',
        text: `Por favor, marca las siguientes casillas: ${missingCheckboxes.join(', ')}.`,
      });
      return;
    }

    // Calcular valores de financiamiento
    const downPaymentPercentage = this.financingFormData.down_payment_percentage || 30;
    const downPayment = this.getDownPaymentByPercentage(downPaymentPercentage);
    const termMonths = this.financingFormData.term_months || this.getMaxAvailableTerm(this.vehicle?.year);
    const financeAmount = this.vehicle?.price ? this.vehicle.price - downPayment : 0;
    
    // Calcular mensualidad con los valores seleccionados
    const monthlyPayment = this.calculateMonthlyPaymentForForm(downPaymentPercentage, termMonths);

    // Recopilar datos del formulario
    const formData = {
      name: this.financingFormData.name || '',
      last_name: this.financingFormData.last_name || '',
      phone: this.financingFormData.phone || '',
      email: this.financingFormData.email || '',
      city: this.financingFormData.city || '',
      address: this.financingFormData.address || '',
      occupation: this.financingFormData.occupation || '',
      monthly_income: this.financingFormData.monthly_income || '',
      company: this.financingFormData.company || '',
      job_tenure: this.financingFormData.job_tenure || '',
      comments: this.financingFormData.comments || '',
      vehicle_brand: this.vehicle?.brand || '',
      vehicle_model: this.vehicle?.model || '',
      vehicle_year: this.vehicle?.year,
      vehicle_price: this.vehicle?.price,
      down_payment: downPayment,
      down_payment_percentage: downPaymentPercentage,
      monthly_payment: monthlyPayment,
      term_months: termMonths,
      finance_amount: financeAmount
    };

    console.log('Enviando datos:', formData);

    this.isSubmitting = true;
    this.leadService.sendFinancingRequest(formData).subscribe({
      next: (response) => {
        console.log('Respuesta exitosa:', response);
        this.isSubmitting = false;
        Swal.fire({
          icon: 'success',
          title: '¡Solicitud enviada!',
          text: 'Tu solicitud de financiamiento ha sido enviada exitosamente.',
          timer: 3000,
          showConfirmButton: false
        });
        // Cerrar ambos modales si están abiertos
        this.showFinancingModal = false;
        this.showFinancingRequestModal = false;
        this.financingRequestStep = 1;
        // Limpiar formulario
        this.financingFormData = {};
        // Resetear casillas
        this.termsAccepted = false;
        this.privacyAccepted = false;
        this.contactAccepted = false;
      },
      error: (error) => {
        console.error('Error al enviar:', error);
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al enviar tu solicitud. Por favor, intenta de nuevo.',
        });
      }
    });
  }

  submitTestDrive() {
    if (this.isSubmitting) return;

    // Construir comentarios con fecha, hora y comentarios adicionales
    const comments = this.buildTestDriveComments(
      this.testDriveFormData.preferred_date || '',
      this.testDriveFormData.preferred_time || '',
      this.testDriveFormData.comments || ''
    );

    const formData = {
      name: this.testDriveFormData.name || '',
      last_name: this.testDriveFormData.last_name || '',
      phone: this.testDriveFormData.phone || '',
      email: this.testDriveFormData.email || '',
      city: this.testDriveFormData.city || '',
      preferred_date: this.testDriveFormData.preferred_date || '',
      preferred_time: this.testDriveFormData.preferred_time || '',
      comments: comments,
      vehicle_brand: this.vehicle?.brand || '',
      vehicle_model: this.vehicle?.model || '',
      vehicle_year: this.vehicle?.year,
      vehicle_uuid: this.vehicle?.uuid
    };

    this.isSubmitting = true;
    this.leadService.sendTestDriveRequest(formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'success',
          title: '¡Solicitud enviada!',
          text: 'Tu solicitud de prueba de manejo ha sido enviada exitosamente.',
          timer: 3000,
          showConfirmButton: false
        });
        this.closeTestDriveModal();
      },
      error: (error) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al enviar tu solicitud. Por favor, intenta de nuevo.',
        });
      }
    });
  }

  submitOffer() {
    if (this.isSubmitting) return;

    // Construir comentarios con monto ofrecido y comentarios adicionales
    const comments = this.buildOfferComments(
      this.offerFormData.offer_amount || 0,
      this.offerFormData.comments || ''
    );

    const formData = {
      name: this.offerFormData.name || '',
      last_name: this.offerFormData.last_name || '',
      phone: this.offerFormData.phone || '',
      email: this.offerFormData.email || '',
      city: this.offerFormData.city || '',
      offer_amount: this.offerFormData.offer_amount || 0,
      payment_conditions: this.offerFormData.payment_conditions || '',
      comments: comments,
      vehicle_brand: this.vehicle?.brand || '',
      vehicle_model: this.vehicle?.model || '',
      vehicle_year: this.vehicle?.year,
      vehicle_uuid: this.vehicle?.uuid
    };

    this.isSubmitting = true;
    this.leadService.sendOfferRequest(formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'success',
          title: '¡Oferta enviada!',
          text: 'Tu oferta ha sido enviada exitosamente. Nos pondremos en contacto contigo pronto.',
          timer: 3000,
          showConfirmButton: false
        });
        this.closeOfferModal();
      },
      error: (error) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al enviar tu oferta. Por favor, intenta de nuevo.',
        });
      }
    });
  }
}
