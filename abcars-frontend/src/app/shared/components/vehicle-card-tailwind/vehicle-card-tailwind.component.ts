import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ScrollService } from '../../services/scroll.service';

export interface Vehicle {
  uuid: string;
  name: string;
  sale_price: number;
  mileage: number;
  exterior_color: string;
  year: number;
  brand?: { name: string };
  model?: { name: string; year: number };
  dealership?: { name: string; location: string };
  first_image?: { service_image_url: string };
}

@Component({
  selector: 'app-vehicle-card-tailwind',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="vehicle-card group max-w-sm cursor-pointer" (click)="navigateToDetail()">
      <!-- Image Container -->
      <div class="relative overflow-hidden rounded-t-2xl">
        <img 
          [src]="vehicle.first_image?.service_image_url || '/assets/placeholder-image.jpg'" 
          [alt]="vehicle.name"
          class="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <!-- Price Badge -->
        <div class="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
          <span class="text-lg font-bold text-abcars-primary">
            {{ formatPrice(vehicle.sale_price) }}
          </span>
        </div>
        <!-- Brand Badge -->
        <div class="absolute top-4 left-4 bg-black bg-opacity-70 backdrop-blur-sm rounded-full px-3 py-1">
          <span class="text-white text-sm font-medium uppercase">
            {{ vehicle.brand?.name || 'N/A' }}
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 bg-white">
        <!-- Vehicle Name -->
        <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {{ vehicle.name }}
        </h3>

        <!-- Vehicle Details -->
        <div class="space-y-3 mb-4">
          <!-- Mileage -->
          <div class="flex items-center text-gray-600">
            <svg class="w-5 h-5 mr-2 text-abcars-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            <span class="text-sm">{{ formatMileage(vehicle.mileage) }} km</span>
          </div>

          <!-- Year -->
          <div class="flex items-center text-gray-600">
            <svg class="w-5 h-5 mr-2 text-abcars-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span class="text-sm">{{ vehicle.model?.year || vehicle.year }}</span>
          </div>

          <!-- Color -->
          <div class="flex items-center text-gray-600">
            <div class="w-4 h-4 rounded-full mr-2 border-2 border-gray-300" 
                 [style.background-color]="getColorCode(vehicle.exterior_color)">
            </div>
            <span class="text-sm capitalize">{{ vehicle.exterior_color }}</span>
          </div>

          <!-- Location -->
          <div class="flex items-center text-gray-600" *ngIf="vehicle.dealership">
            <svg class="w-5 h-5 mr-2 text-abcars-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span class="text-sm capitalize">{{ vehicle.dealership.location }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button class="btn-abcars-secondary flex-1" (click)="contactVehicle($event)">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 21v-7a6 6 0 00-6-6H6a6 6 0 00-6 6v7"></path>
            </svg>
            Contacto
          </button>
          <button class="btn-abcars-secondary px-4" (click)="toggleFavorite($event)">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Hover Effect Overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class VehicleCardTailwindComponent {
  @Input() vehicle!: Vehicle;

  constructor(private router: Router, private scrollService: ScrollService) {}

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  formatMileage(mileage: number): string {
    return new Intl.NumberFormat('es-MX').format(mileage);
  }

  getColorCode(colorName: string): string {
    const colorMap: { [key: string]: string } = {
      'rojo': '#dc2626',
      'azul': '#2563eb',
      'negro': '#1f2937',
      'blanco': '#f8fafc',
      'gris': '#6b7280',
      'amarillo': '#eab308',
      'verde': '#16a34a',
      'naranja': '#ea580c',
      'beige': '#d6d3d1'
    };
    return colorMap[colorName?.toLowerCase()] || '#6b7280';
  }

  // Navegar al detalle del vehículo
  navigateToDetail(): void {
    this.router.navigate(['/vehiculo', this.vehicle.uuid]);
    // Hacer scroll to top después de la navegación
    setTimeout(() => {
      this.scrollService.scrollToTop();
    }, 100);
  }

  // Contactar sobre el vehículo
  contactVehicle(event: Event): void {
    event.stopPropagation(); // Evitar que se active el click de la tarjeta
    const message = `Hola, estoy interesado en el ${this.vehicle.name}. Precio: $${this.formatPrice(this.vehicle.sale_price)}. ¿Podrían darme más información?`;
    const whatsappUrl = `https://wa.me/5217771234567?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  // Agregar/quitar de favoritos
  toggleFavorite(event: Event): void {
    event.stopPropagation(); // Evitar que se active el click de la tarjeta
    console.log('Agregar/quitar de favoritos:', this.vehicle.name);
    // Aquí implementarías la lógica para favoritos
  }
} 