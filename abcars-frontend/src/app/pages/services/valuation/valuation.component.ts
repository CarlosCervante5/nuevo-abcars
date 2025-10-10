import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../../shared/components/modern-footer/modern-footer.component';

@Component({
  selector: 'app-valuation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HomeNavComponent, ModernFooterComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navbar -->
      <app-home-nav></app-home-nav>
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-teal-600 to-teal-800 text-white py-16 pt-32">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-4xl lg:text-5xl font-bold mb-4">Valuación Gratuita</h1>
            <p class="text-xl text-teal-100 mb-8">Obtén una valuación profesional y gratuita de tu vehículo en menos de 24 horas</p>
            <div class="flex flex-wrap justify-center gap-4 text-sm">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-teal-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>100% gratuita</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-teal-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Respuesta en 24 horas</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-teal-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Sin compromiso</span>
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
              
              <!-- Formulario de valuación -->
              <div class="bg-white rounded-3xl p-8 shadow-sm">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Solicitar Valuación</h2>
                
                <form class="space-y-6">
                  <!-- Información del vehículo -->
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Información del Vehículo</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Marca *</label>
                        <select 
                          [(ngModel)]="valuationData.brand"
                          name="brand"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          required
                        >
                          <option value="">Selecciona marca</option>
                          <option value="toyota">Toyota</option>
                          <option value="honda">Honda</option>
                          <option value="nissan">Nissan</option>
                          <option value="volkswagen">Volkswagen</option>
                          <option value="chevrolet">Chevrolet</option>
                          <option value="ford">Ford</option>
                          <option value="hyundai">Hyundai</option>
                          <option value="kia">Kia</option>
                          <option value="mazda">Mazda</option>
                          <option value="mitsubishi">Mitsubishi</option>
                        </select>
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Modelo *</label>
                        <input 
                          type="text" 
                          [(ngModel)]="valuationData.model"
                          name="model"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="Ej: Corolla"
                          required
                        >
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Año *</label>
                        <select 
                          [(ngModel)]="valuationData.year"
                          name="year"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          required
                        >
                          <option value="">Selecciona año</option>
                          <option *ngFor="let year of getYears()" [value]="year">{{ year }}</option>
                        </select>
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Versión</label>
                        <input 
                          type="text" 
                          [(ngModel)]="valuationData.version"
                          name="version"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="Ej: LE, XLE, Sport"
                        >
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Kilometraje *</label>
                        <input 
                          type="number" 
                          [(ngModel)]="valuationData.mileage"
                          name="mileage"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="Ej: 50000"
                          required
                        >
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Color</label>
                        <select 
                          [(ngModel)]="valuationData.color"
                          name="color"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="">Selecciona color</option>
                          <option value="blanco">Blanco</option>
                          <option value="negro">Negro</option>
                          <option value="gris">Gris</option>
                          <option value="plata">Plata</option>
                          <option value="azul">Azul</option>
                          <option value="rojo">Rojo</option>
                          <option value="verde">Verde</option>
                          <option value="amarillo">Amarillo</option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <!-- Estado del vehículo -->
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Estado del Vehículo</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Estado general *</label>
                        <select 
                          [(ngModel)]="valuationData.condition"
                          name="condition"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          required
                        >
                          <option value="">Selecciona estado</option>
                          <option value="excelente">Excelente</option>
                          <option value="muy-bueno">Muy bueno</option>
                          <option value="bueno">Bueno</option>
                          <option value="regular">Regular</option>
                          <option value="malo">Malo</option>
                        </select>
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de transmisión</label>
                        <select 
                          [(ngModel)]="valuationData.transmission"
                          name="transmission"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="">Selecciona transmisión</option>
                          <option value="automatica">Automática</option>
                          <option value="manual">Manual</option>
                          <option value="cvt">CVT</option>
                        </select>
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Combustible</label>
                        <select 
                          [(ngModel)]="valuationData.fuel"
                          name="fuel"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="">Selecciona combustible</option>
                          <option value="gasolina">Gasolina</option>
                          <option value="diesel">Diésel</option>
                          <option value="hibrido">Híbrido</option>
                          <option value="electrico">Eléctrico</option>
                        </select>
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Número de puertas</label>
                        <select 
                          [(ngModel)]="valuationData.doors"
                          name="doors"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="">Selecciona puertas</option>
                          <option value="2">2 puertas</option>
                          <option value="4">4 puertas</option>
                          <option value="5">5 puertas</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <!-- Equipamiento -->
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Equipamiento</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <label class="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          [(ngModel)]="valuationData.airConditioning"
                          name="airConditioning"
                          class="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        >
                        <span class="text-sm text-gray-700">Aire acondicionado</span>
                      </label>
                      
                      <label class="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          [(ngModel)]="valuationData.powerSteering"
                          name="powerSteering"
                          class="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        >
                        <span class="text-sm text-gray-700">Dirección hidráulica</span>
                      </label>
                      
                      <label class="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          [(ngModel)]="valuationData.powerWindows"
                          name="powerWindows"
                          class="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        >
                        <span class="text-sm text-gray-700">Vidrios eléctricos</span>
                      </label>
                      
                      <label class="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          [(ngModel)]="valuationData.centralLock"
                          name="centralLock"
                          class="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        >
                        <span class="text-sm text-gray-700">Seguros centrales</span>
                      </label>
                      
                      <label class="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          [(ngModel)]="valuationData.alarm"
                          name="alarm"
                          class="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        >
                        <span class="text-sm text-gray-700">Alarma</span>
                      </label>
                      
                      <label class="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          [(ngModel)]="valuationData.gps"
                          name="gps"
                          class="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        >
                        <span class="text-sm text-gray-700">GPS</span>
                      </label>
                    </div>
                  </div>

                  <!-- Observaciones -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Observaciones adicionales</label>
                    <textarea 
                      [(ngModel)]="valuationData.observations"
                      name="observations"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      rows="4"
                      placeholder="Describe cualquier detalle adicional sobre el estado del vehículo, accidentes, reparaciones, etc."
                    ></textarea>
                  </div>
                </form>
              </div>

              <!-- Proceso de valuación -->
              <div class="bg-white rounded-3xl p-8 shadow-sm">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">¿Cómo funciona nuestro proceso?</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div class="text-center">
                    <div class="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span class="text-2xl font-bold text-teal-600">1</span>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Completa el formulario</h3>
                    <p class="text-gray-600 text-sm">Proporciona la información detallada de tu vehículo para una valuación precisa.</p>
                  </div>
                  
                  <div class="text-center">
                    <div class="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span class="text-2xl font-bold text-teal-600">2</span>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Evaluación profesional</h3>
                    <p class="text-gray-600 text-sm">Nuestros expertos analizan tu vehículo usando las últimas herramientas del mercado.</p>
                  </div>
                  
                  <div class="text-center">
                    <div class="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span class="text-2xl font-bold text-teal-600">3</span>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Recibe tu valuación</h3>
                    <p class="text-gray-600 text-sm">Obtén tu valuación detallada en menos de 24 horas, sin compromiso.</p>
                  </div>
                </div>
              </div>

              <!-- Beneficios -->
              <div class="bg-white rounded-3xl p-8 shadow-sm">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">¿Por qué elegir nuestra valuación?</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">100% Gratuita</h3>
                      <p class="text-gray-600">No hay costo alguno por la valuación, es completamente gratuita.</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">Evaluación profesional</h3>
                      <p class="text-gray-600">Utilizamos las mejores herramientas y experiencia del mercado.</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">Respuesta rápida</h3>
                      <p class="text-gray-600">Recibe tu valuación en menos de 24 horas hábiles.</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">Sin compromiso</h3>
                      <p class="text-gray-600">No estás obligado a vender tu vehículo con nosotros.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
              
              <!-- Formulario de contacto -->
              <div class="bg-white rounded-3xl p-6 shadow-sm sticky top-8">
                <h3 class="text-xl font-bold text-gray-900 mb-4">Información de Contacto</h3>
                
                <form class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
                    <input 
                      type="text" 
                      [(ngModel)]="contactData.fullName"
                      name="fullName"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Tu nombre completo"
                      required
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input 
                      type="tel" 
                      [(ngModel)]="contactData.phone"
                      name="phone"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Tu número de teléfono"
                      required
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input 
                      type="email" 
                      [(ngModel)]="contactData.email"
                      name="email"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="tu@email.com"
                      required
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
                    <input 
                      type="text" 
                      [(ngModel)]="contactData.city"
                      name="city"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Tu ciudad"
                    >
                  </div>
                  
                  <button 
                    type="submit"
                    (click)="submitValuation()"
                    class="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                  >
                    Solicitar Valuación Gratuita
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
export class ValuationComponent {
  valuationData = {
    brand: '',
    model: '',
    year: '',
    version: '',
    mileage: 0,
    color: '',
    condition: '',
    transmission: '',
    fuel: '',
    doors: '',
    airConditioning: false,
    powerSteering: false,
    powerWindows: false,
    centralLock: false,
    alarm: false,
    gps: false,
    observations: ''
  };

  contactData = {
    fullName: '',
    phone: '',
    email: '',
    city: ''
  };

  getYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 30; i--) {
      years.push(i);
    }
    return years;
  }

  submitValuation() {
    // Aquí se enviaría la información al backend
    console.log('Valuation data:', this.valuationData);
    console.log('Contact data:', this.contactData);
    
    // Simulación de envío exitoso
    alert('¡Valuación solicitada exitosamente! Te contactaremos en menos de 24 horas.');
  }
}
