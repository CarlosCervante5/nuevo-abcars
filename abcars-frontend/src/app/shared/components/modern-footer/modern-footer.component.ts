import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
              <a href="#" class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.001 12.017 24.001c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                </svg>
              </a>
              <a href="#" class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.001 12.017 24.001c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
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
              <li><a [routerLink]="['/refacciones']" class="text-gray-300 hover:text-white transition-colors text-sm">Refacciones originales</a></li>
              <li><a [routerLink]="['/valuacion']" class="text-gray-300 hover:text-white transition-colors text-sm">Valuación gratuita</a></li>
            </ul>
          </div>

          <!-- Columna 3: Marcas disponibles -->
          <div class="space-y-4">
            <h4 class="text-lg font-bold text-white mb-4">Marcas disponibles</h4>
            <ul class="space-y-2">
              <li><a href="#" class="text-gray-300 hover:text-white transition-colors text-sm">BMW</a></li>
              <li><a href="#" class="text-gray-300 hover:text-white transition-colors text-sm">Mercedes-Benz</a></li>
              <li><a href="#" class="text-gray-300 hover:text-white transition-colors text-sm">Audi</a></li>
              <li><a href="#" class="text-gray-300 hover:text-white transition-colors text-sm">Toyota</a></li>
              <li><a href="#" class="text-gray-300 hover:text-white transition-colors text-sm">Honda</a></li>
              <li><a href="#" class="text-gray-300 hover:text-white transition-colors text-sm">Chevrolet</a></li>
            </ul>
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
              <a href="#" class="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
                </svg>
                <span>WhatsApp</span>
              </a>
              
              <a href="#" class="flex items-center justify-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                <span>Llamar: 222 303 9910</span>
              </a>
              
              <a href="#" class="flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors">
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
        <div class="mt-12 pt-8 border-t border-gray-700">
          <div class="flex flex-col md:flex-row justify-between items-center">
            <p class="text-gray-400 text-sm">&copy; {{ currentYear }} ABCars. Todos los derechos reservados.</p>
            <div class="flex space-x-6 mt-4 md:mt-0">
              <a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Política de Privacidad</a>
              <a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Términos y Condiciones</a>
              <a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Aviso Legal</a>
              <a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Sitemap</a>
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
export class ModernFooterComponent {
  currentYear = new Date().getFullYear();
} 