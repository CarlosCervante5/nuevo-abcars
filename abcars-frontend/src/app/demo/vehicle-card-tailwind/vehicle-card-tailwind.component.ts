import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-vehicle-card-tailwind',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="vehicle-card group">
      
      <!-- Image Container -->
      <div class="relative overflow-hidden rounded-t-2xl">
        <img 
          [src]="vehicle.image" 
          [alt]="vehicle.brand + ' ' + vehicle.model"
          class="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
        >
        
        <!-- Certification Badge -->
        <div class="absolute top-4 left-4">
          <span 
            class="certification-badge"
            [ngClass]="{
              'bg-green-500': vehicle.certification === 'premium',
              'bg-blue-500': vehicle.certification === 'certified',
              'bg-yellow-500': vehicle.certification === 'new'
            }">
            {{ getCertificationText(vehicle.certification) }}
          </span>
        </div>

        <!-- Price Badge -->
        <div class="absolute top-4 right-4">
          <div class="price-badge">
            {{ formatPrice(vehicle.price) }}
          </div>
        </div>

        <!-- Favorite Button -->
        <button class="favorite-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="vehicle-title">{{ vehicle.brand }} {{ vehicle.model }}</h3>
            <p class="vehicle-year">{{ vehicle.year }}</p>
          </div>
          <div class="dealership-badge">
            {{ vehicle.dealership }}
          </div>
        </div>

        <!-- Key Info -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="info-item">
            <div class="info-icon bg-blue-100 text-blue-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div>
              <div class="info-label">Combustible</div>
              <div class="info-value">{{ vehicle.fuel }}</div>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon bg-green-100 text-green-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
              </svg>
            </div>
            <div>
              <div class="info-label">Transmisión</div>
              <div class="info-value">{{ vehicle.transmission }}</div>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon bg-yellow-100 text-yellow-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2z"></path>
              </svg>
            </div>
            <div>
              <div class="info-label">Kilometraje</div>
              <div class="info-value">{{ formatMileage(vehicle.mileage) }}</div>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon bg-purple-100 text-purple-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <div>
              <div class="info-label">Ubicación</div>
              <div class="info-value">{{ vehicle.location }}</div>
            </div>
          </div>
        </div>

        <!-- Features -->
        <div class="mb-6">
          <div class="features-label">Características principales</div>
          <div class="flex flex-wrap gap-2 mt-2">
            <span 
              *ngFor="let feature of vehicle.features.slice(0, 4)" 
              class="feature-tag">
              {{ feature }}
            </span>
            <span 
              *ngIf="vehicle.features.length > 4" 
              class="feature-tag-more">
              +{{ vehicle.features.length - 4 }} más
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button class="btn-primary flex-1">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            Ver Detalles
          </button>
          
          <button class="btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* Card Container */
    .vehicle-card {
      @apply bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 hover:-translate-y-2 overflow-hidden;
    }

    /* Badges */
    .certification-badge {
      @apply px-3 py-1 text-white text-base font-semibold rounded-full shadow-lg;
    }

    .price-badge {
      @apply px-4 py-2 bg-white/[.95] backdrop-blur-sm text-gray-900 font-bold text-xl rounded-xl shadow-lg;
    }

    .dealership-badge {
      @apply px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full;
    }

    /* Favorite Button */
    .favorite-btn {
      @apply absolute bottom-4 right-4 w-12 h-12 bg-white/[.95] backdrop-blur-sm text-gray-600 hover:text-red-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300;
    }

    /* Vehicle Info */
    .vehicle-title {
      @apply text-2xl font-bold text-gray-900 mb-1;
    }

    .vehicle-year {
      @apply text-lg text-gray-500 font-medium;
    }

    /* Info Items */
    .info-item {
      @apply flex items-center space-x-3;
    }

    .info-icon {
      @apply w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0;
    }

    .info-label {
      @apply text-base text-gray-500 font-medium;
    }

    .info-value {
      @apply text-lg font-semibold text-gray-900;
    }

    /* Features */
    .features-label {
      @apply text-lg font-semibold text-gray-900 mb-2;
    }

    .feature-tag {
      @apply px-3 py-1.5 bg-gray-100 text-gray-700 text-base font-medium rounded-lg;
    }

    .feature-tag-more {
      @apply px-3 py-1.5 bg-primary-100 text-primary-700 text-base font-medium rounded-lg;
    }

    /* Buttons */
    .btn-primary {
      @apply flex items-center justify-center px-4 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-300;
    }

    .btn-secondary {
      @apply flex items-center justify-center p-4 bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition-all duration-300;
    }
  `]
})
export class VehicleCardTailwindComponent {
  @Input() vehicle: any;

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatMileage(mileage: number): string {
    if (mileage === 0) return '0 km';
    return new Intl.NumberFormat('es-MX').format(mileage) + ' km';
  }

  getCertificationText(certification: string): string {
    switch (certification) {
      case 'premium': return 'Premium';
      case 'certified': return 'Certificado';
      case 'new': return 'Nuevo';
      default: return 'Estándar';
    }
  }
} 