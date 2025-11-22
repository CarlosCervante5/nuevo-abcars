import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../shared/components/modern-footer/modern-footer.component';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule, HomeNavComponent, ModernFooterComponent],
  template: `
    <!-- Navbar -->
    <app-home-nav></app-home-nav>

    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 pt-32">
      <div class="container mx-auto px-4">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">Nuestros Servicios</h1>
          <p class="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Ofrecemos una amplia gama de servicios para satisfacer todas tus necesidades automotrices
          </p>
        </div>
      </div>
    </div>

    <!-- Services Grid -->
    <div class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <!-- Venta de Seminuevos -->
          <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8">
            <div class="text-center">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-800 mb-4">Venta de Seminuevos</h3>
              <p class="text-gray-600 mb-6">
                Descubre nuestra amplia selección de vehículos seminuevos con garantía y la mejor calidad.
              </p>
              <a [routerLink]="['/inventario']" 
                 class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300">
                Ver Vehículos
              </a>
            </div>
          </div>

          <!-- Financiamiento -->
          <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8">
            <div class="text-center">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-800 mb-4">Financiamiento</h3>
              <p class="text-gray-600 mb-6">
                Obtén el financiamiento que necesitas con las mejores tasas y condiciones del mercado.
              </p>
              <a [routerLink]="['/financiamiento']" 
                 class="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300">
                Solicitar Financiamiento
              </a>
            </div>
          </div>

          <!-- Seguros Automotrices -->
          <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8">
            <div class="text-center">
              <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-800 mb-4">Seguros Automotrices</h3>
              <p class="text-gray-600 mb-6">
                Protege tu vehículo con nuestros seguros automotrices y las mejores coberturas.
              </p>
              <a [routerLink]="['/seguros']" 
                 class="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-300">
                Cotizar Seguro
              </a>
            </div>
          </div>

          <!-- Servicio Técnico -->
          <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8">
            <div class="text-center">
              <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-800 mb-4">Servicio Técnico</h3>
              <p class="text-gray-600 mb-6">
                Mantén tu vehículo en perfecto estado con nuestro servicio técnico especializado.
              </p>
              <a [routerLink]="['/servicio-tecnico']" 
                 class="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-300">
                Agendar Servicio
              </a>
            </div>
          </div>

          <!-- Refacciones Originales -->
          <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8">
            <div class="text-center">
              <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-800 mb-4">Refacciones Originales</h3>
              <p class="text-gray-600 mb-6">
                Encuentra las refacciones originales que necesitas para tu vehículo con garantía.
              </p>
              <a [routerLink]="['/refacciones']" 
                 class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-300">
                Ver Refacciones
              </a>
            </div>
          </div>

          <!-- Valuación Gratuita -->
          <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8">
            <div class="text-center">
              <div class="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-800 mb-4">Valuación Gratuita</h3>
              <p class="text-gray-600 mb-6">
                Obtén una valuación profesional y gratuita de tu vehículo al instante.
              </p>
              <a [routerLink]="['/valuacion']" 
                 class="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors duration-300">
                Valuar Mi Auto
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Call to Action Section -->
    <div class="bg-blue-600 text-white py-16">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">¿Necesitas Ayuda?</h2>
        <p class="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Nuestro equipo de expertos está listo para ayudarte a encontrar la solución perfecta para tus necesidades automotrices.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a [routerLink]="['/inventario']" 
             class="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300">
            Ver Vehículos Disponibles
          </a>
          <a [routerLink]="['/financiamiento']" 
             class="inline-block bg-yellow-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors duration-300">
            Solicitar Financiamiento
          </a>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <app-modern-footer></app-modern-footer>
  `
})
export class ServicesComponent {
}














