import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VehicleService } from '@services/vehicle.service';
import { Brand, BrandsResponse } from '@interfaces/vehicle_data.interface';

@Component({
  selector: 'app-modern-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Footer Rediseñado inspirado en la imagen -->
    <footer class="bg-gray-900 text-white">
      <div class="w-full mx-auto py-16 px-8 lg:px-12">
        
        <!-- Grid principal de 4 columnas -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          <!-- Columna 1: Información de la empresa -->
          <div class="space-y-4">
            <!-- Logo ABCars -->
            <div class="flex items-center mb-4">
              <img src="assets/images/logo.svg" alt="ABCars Logo" class="h-12 w-auto">
            </div>
            
            <p class="text-gray-300 text-sm leading-relaxed">
              Tu concesionario de confianza en México. Más de 15 años ayudando a encontrar el auto perfecto para ti y tu familia.
            </p>
            
            <!-- Redes Sociales -->
            <div class="flex space-x-3 pt-4">
              <!-- Facebook -->
              <a href="https://www.facebook.com/ABcarsmx-102437159099755" target="_blank" rel="noopener noreferrer" class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <!-- Instagram -->
              <a href="https://www.instagram.com/accounts/login/?next=/abcars.mx/" target="_blank" rel="noopener noreferrer" class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <!-- YouTube -->
              <a href="https://www.youtube.com/channel/UCp24KS6l8nED1nys2NFkkaw" target="_blank" rel="noopener noreferrer" class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <!-- TikTok -->
              <a href="https://www.tiktok.com/@abcars.mx" target="_blank" rel="noopener noreferrer" class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Columna 2: Servicios -->
          <div class="space-y-4">
            <h4 class="text-lg font-bold text-white mb-4">Servicios</h4>
            <ul class="space-y-2">
              <li><a [routerLink]="['/inventario']" class="text-gray-300 hover:text-white transition-colors text-sm">Venta de seminuevos</a></li>
              <li><a [routerLink]="['/financiamiento']" class="text-gray-300 hover:text-white transition-colors text-sm">Financiamiento</a></li>
              <li><a [routerLink]="['/seguros']" class="text-gray-300 hover:text-white transition-colors text-sm">Seguros automotrices</a></li>
              <li><a [routerLink]="['/servicio-tecnico']" class="text-gray-300 hover:text-white transition-colors text-sm">Servicio técnico</a></li>
              <!-- <li><a [routerLink]="['/refacciones']" class="text-gray-300 hover:text-white transition-colors text-sm">Refacciones originales</a></li> -->
              <li><a [routerLink]="['/valuacion']" class="text-gray-300 hover:text-white transition-colors text-sm">Valuación gratuita</a></li>
            </ul>
          </div>

          <!-- Columna 3: Marcas disponibles -->
          <div class="space-y-4">
            <h4 class="text-lg font-bold text-white mb-4">Marcas disponibles</h4>
            <ng-container *ngIf="availableBrands.length; else noBrands">
              <ul class="space-y-2">
                <li *ngFor="let brand of availableBrands | slice:0:maxBrandsToShow; trackBy: trackByBrand">
                  <a href="#" class="text-gray-300 hover:text-white transition-colors text-sm">
                    {{ brand.name }}
                  </a>
                </li>
              </ul>
            </ng-container>
            <ng-template #noBrands>
              <p class="text-gray-400 text-sm">Cargando marcas...</p>
            </ng-template>
            <a href="#" class="text-white hover:text-yellow-400 transition-colors text-sm font-medium flex items-center">
              Ver todas las marcas
              <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>

          <!-- Columna 4: ¿Listo para comprar? -->
          <div class="space-y-4">
            <h4 class="text-lg font-bold text-white mb-4">¿Listo para comprar?</h4>
            
            <!-- Botones de contacto -->
            <div class="space-y-3">
              <a href="https://wa.me/5212221263726?text=Hola%20ABCars,%20tengo%20duda%20acerca%20de%20un%20auto..." target="_blank" rel="noopener noreferrer" class="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
                </svg>
                <span>WhatsApp</span>
              </a>
              
              <a href="tel:+522223039910" class="flex items-center justify-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                <span>Llamar: 222 303 9910</span>
              </a>
              
              <a href="mailto:contacto@abcars.mx" class="flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span>contacto&#64;abcars.mx</span>
              </a>
            </div>
            
            <!-- Horarios de atención -->
            <div class="mt-6">
              <h5 class="text-white font-bold text-sm mb-2">Horarios de atención</h5>
              <div class="text-gray-300 text-sm space-y-1">
                <p>Lun-Vie: 9:00-19:00</p>
                <p>Sáb: 9:00-17:00</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Línea divisoria y enlaces legales -->
        <div class="mt-4 pt-3 border-t border-gray-700">
          <div class="flex flex-col md:flex-row justify-between items-baseline">
            <p class="text-gray-400 text-sm">&copy; {{ currentYear }} ABCars. Todos los derechos reservados.</p>
            <div class="flex space-x-6 mt-4 md:mt-0">
              <a [routerLink]="['/externals/privacidad-de-uso']" class="text-gray-400 hover:text-white transition-colors text-sm">Política de Privacidad</a>
              <a [routerLink]="['/externals/terminos-y-condiciones']" class="text-gray-400 hover:text-white transition-colors text-sm">Términos y Condiciones</a>
              <!-- <a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Aviso Legal</a>
              <a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Sitemap</a> -->
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    /* Estilos específicos para el footer moderno */
    .footer-link {
      @apply text-gray-300 hover:text-white transition-colors text-sm;
    }
    .footer-link-legal {
      @apply text-gray-400 hover:text-white transition-colors text-sm;
    }
  `]
})
export class ModernFooterComponent implements OnInit {
  currentYear = new Date().getFullYear();
  availableBrands: Brand[] = [];
  maxBrandsToShow = 6;

  constructor(private vehicleService: VehicleService) {}

  ngOnInit(): void {
    this.loadBrands();
  }

  private loadBrands(): void {
    this.vehicleService.getBrands().subscribe({
      next: (response: BrandsResponse) => {
        this.availableBrands = response?.data?.vehicle_brands ?? [];
      },
      error: () => {
        this.availableBrands = [];
      }
    });
  }

  trackByBrand(index: number, brand: Brand): string {
    return brand?.name ?? `brand-${index}`;
  }
} 