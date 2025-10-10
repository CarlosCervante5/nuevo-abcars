import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../../shared/components/modern-footer/modern-footer.component';

@Component({
  selector: 'app-technical-service',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HomeNavComponent, ModernFooterComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navbar -->
      <app-home-nav></app-home-nav>
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-red-600 to-red-800 text-white py-16 pt-32">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-4xl lg:text-5xl font-bold mb-4">Servicio Técnico</h1>
            <p class="text-xl text-red-100 mb-8">Mantenimiento y reparación especializada con técnicos certificados</p>
            <div class="flex flex-wrap justify-center gap-4 text-sm">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Técnicos certificados</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Refacciones originales</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Garantía en servicio</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido principal -->
      <div class="container mx-auto px-4 py-16">
        <div class="max-w-6xl mx-auto">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- Columna principal -->
            <div class="lg:col-span-2 space-y-8">
              
              <!-- Servicios disponibles -->
              <div class="bg-white rounded-3xl p-8 shadow-sm">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Nuestros Servicios</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div *ngFor="let service of services" class="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                    <div class="flex items-start gap-4">
                      <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" [class]="service.colorClass">
                        <svg class="w-6 h-6 text-white" [innerHTML]="service.icon"></svg>
                      </div>
                      <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ service.name }}</h3>
                        <p class="text-gray-600 text-sm mb-3">{{ service.description }}</p>
                        <div class="flex items-center justify-between">
                          <span class="text-lg font-bold text-red-600">MXN {{ service.price | number }}</span>
                          <span class="text-sm text-gray-500">{{ service.duration }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mantenimiento preventivo -->
              <div class="bg-white rounded-3xl p-8 shadow-sm">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Mantenimiento Preventivo</h2>
                
                <div class="space-y-6">
                  <div class="border-l-4 border-red-500 pl-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Servicio de 10,000 km</h3>
                    <p class="text-gray-600 mb-3">Mantenimiento básico que incluye cambio de aceite, filtros y revisión general.</p>
                    <ul class="space-y-1 text-sm text-gray-600">
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Cambio de aceite y filtro
                      </li>
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Revisión de frenos
                      </li>
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Revisión de llantas
                      </li>
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Revisión de luces
                      </li>
                    </ul>
                    <div class="mt-4 flex items-center justify-between">
                      <span class="text-lg font-bold text-red-600">MXN 1,200</span>
                      <span class="text-sm text-gray-500">2 horas</span>
                    </div>
                  </div>
                  
                  <div class="border-l-4 border-blue-500 pl-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Servicio de 20,000 km</h3>
                    <p class="text-gray-600 mb-3">Mantenimiento intermedio con revisión más profunda del vehículo.</p>
                    <ul class="space-y-1 text-sm text-gray-600">
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Todo lo del servicio de 10,000 km
                      </li>
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Cambio de filtro de aire
                      </li>
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Revisión de suspensión
                      </li>
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Revisión de sistema eléctrico
                      </li>
                    </ul>
                    <div class="mt-4 flex items-center justify-between">
                      <span class="text-lg font-bold text-red-600">MXN 2,500</span>
                      <span class="text-sm text-gray-500">4 horas</span>
                    </div>
                  </div>
                  
                  <div class="border-l-4 border-green-500 pl-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Servicio de 40,000 km</h3>
                    <p class="text-gray-600 mb-3">Mantenimiento mayor con cambio de componentes importantes.</p>
                    <ul class="space-y-1 text-sm text-gray-600">
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Todo lo del servicio de 20,000 km
                      </li>
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Cambio de bujías
                      </li>
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Cambio de filtro de combustible
                      </li>
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Revisión de transmisión
                      </li>
                    </ul>
                    <div class="mt-4 flex items-center justify-between">
                      <span class="text-lg font-bold text-red-600">MXN 4,500</span>
                      <span class="text-sm text-gray-500">6 horas</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Diagnóstico computarizado -->
              <div class="bg-white rounded-3xl p-8 shadow-sm">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Diagnóstico Computarizado</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                    <div class="flex items-center gap-4 mb-4">
                      <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-lg font-semibold text-gray-900">Diagnóstico General</h3>
                        <p class="text-sm text-gray-600">Revisión completa del sistema</p>
                      </div>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">Análisis completo de todos los sistemas del vehículo usando tecnología de punta.</p>
                    <div class="flex items-center justify-between">
                      <span class="text-lg font-bold text-blue-600">MXN 800</span>
                      <span class="text-sm text-gray-500">1 hora</span>
                    </div>
                  </div>
                  
                  <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
                    <div class="flex items-center gap-4 mb-4">
                      <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-lg font-semibold text-gray-900">Diagnóstico Específico</h3>
                        <p class="text-sm text-gray-600">Revisión de sistema específico</p>
                      </div>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">Diagnóstico enfocado en un sistema específico del vehículo.</p>
                    <div class="flex items-center justify-between">
                      <span class="text-lg font-bold text-green-600">MXN 500</span>
                      <span class="text-sm text-gray-500">30 min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
              
              <!-- Formulario de agendamiento -->
              <div class="bg-white rounded-3xl p-6 shadow-sm sticky top-8">
                <h3 class="text-xl font-bold text-gray-900 mb-4">Agendar Servicio</h3>
                
                <form class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
                    <input 
                      type="text" 
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Tu nombre completo"
                      required
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input 
                      type="tel" 
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Tu número de teléfono"
                      required
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input 
                      type="email" 
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="tu@email.com"
                      required
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de servicio *</label>
                    <select class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" required>
                      <option value="">Selecciona servicio</option>
                      <option value="mantenimiento">Mantenimiento preventivo</option>
                      <option value="diagnostico">Diagnóstico computarizado</option>
                      <option value="reparacion">Reparación</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Fecha preferida</label>
                    <input 
                      type="date" 
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Hora preferida</label>
                    <select class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                      <option value="">Selecciona hora</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                    </select>
                  </div>
                  
                  <button 
                    type="submit"
                    class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                  >
                    Agendar Servicio
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <app-modern-footer></app-modern-footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TechnicalServiceComponent {
  services = [
    {
      name: 'Cambio de aceite',
      description: 'Cambio de aceite y filtro con productos de calidad premium.',
      price: 800,
      duration: '30 min',
      colorClass: 'bg-blue-500',
      icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'
    },
    {
      name: 'Revisión de frenos',
      description: 'Revisión completa del sistema de frenos y cambio de pastillas.',
      price: 1200,
      duration: '1 hora',
      colorClass: 'bg-red-500',
      icon: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>'
    },
    {
      name: 'Alineación y balanceo',
      description: 'Alineación de dirección y balanceo de llantas para mejor manejo.',
      price: 600,
      duration: '45 min',
      colorClass: 'bg-green-500',
      icon: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'
    },
    {
      name: 'Revisión de aire acondicionado',
      description: 'Revisión y recarga del sistema de aire acondicionado.',
      price: 900,
      duration: '1 hora',
      colorClass: 'bg-blue-500',
      icon: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>'
    },
    {
      name: 'Cambio de batería',
      description: 'Instalación de batería nueva con garantía del fabricante.',
      price: 1500,
      duration: '20 min',
      colorClass: 'bg-yellow-500',
      icon: '<path d="M15.67 4H14V2c0-.55-.45-1-1-1s-1 .45-1 1v2H5.33C4.6 4 4 4.6 4 5.33v15.33C4 21.4 4.6 22 5.33 22h10.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM13 18H7v-2h6v2zm0-4H7v-2h6v2zm0-4H7V8h6v2z"/>'
    },
    {
      name: 'Revisión de transmisión',
      description: 'Revisión completa del sistema de transmisión automática o manual.',
      price: 2000,
      duration: '2 horas',
      colorClass: 'bg-purple-500',
      icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'
    }
  ];
}
