import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../../shared/components/modern-footer/modern-footer.component';

@Component({
  selector: 'app-financing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HomeNavComponent, ModernFooterComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navbar -->
      <app-home-nav></app-home-nav>
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 pt-32">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-4xl lg:text-5xl font-bold mb-4">Financiamiento Automotriz</h1>
            <p class="text-xl text-blue-100 mb-8">Obtén el financiamiento que necesitas para tu vehículo con las mejores condiciones del mercado</p>
            <div class="flex flex-wrap justify-center gap-4 text-sm">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Aprobación rápida</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Tasas competitivas</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Plazos flexibles</span>
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
              
              <!-- Calculadora de financiamiento -->
              <div class="bg-white rounded-3xl p-8 shadow-sm">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Calculadora de Financiamiento</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Precio del vehículo</label>
                    <input 
                      type="number" 
                      [(ngModel)]="calculatorData.vehiclePrice"
                      (input)="updateCalculations()"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: 500000"
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Enganche (%)</label>
                    <input 
                      type="range" 
                      min="10" 
                      max="50" 
                      [(ngModel)]="calculatorData.downPaymentPercentage"
                      (input)="updateCalculations()"
                      class="w-full"
                    >
                    <div class="text-center text-sm text-gray-600 mt-1">{{ calculatorData.downPaymentPercentage }}%</div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Plazo (meses)</label>
                    <select 
                      [(ngModel)]="calculatorData.termMonths"
                      (change)="updateCalculations()"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="12">12 meses</option>
                      <option value="24">24 meses</option>
                      <option value="36">36 meses</option>
                      <option value="48">48 meses</option>
                      <option value="60">60 meses</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Tasa de interés anual (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      [(ngModel)]="calculatorData.interestRate"
                      (input)="updateCalculations()"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: 12.5"
                    >
                  </div>
                </div>
                
                <!-- Resultados -->
                <div class="mt-8 p-6 bg-blue-50 rounded-2xl">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Resumen de tu financiamiento</h3>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="text-center">
                      <div class="text-2xl font-bold text-blue-600">MXN {{ getDownPayment() | number:'1.2-2' }}</div>
                      <div class="text-sm text-gray-600">Enganche</div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl font-bold text-blue-600">MXN {{ getMonthlyPayment() | number:'1.2-2' }}</div>
                      <div class="text-sm text-gray-600">Mensualidad</div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl font-bold text-blue-600">MXN {{ getTotalAmount() | number:'1.2-2' }}</div>
                      <div class="text-sm text-gray-600">Total a pagar</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Beneficios del financiamiento -->
              <div class="bg-white rounded-3xl p-8 shadow-sm">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">¿Por qué elegir nuestro financiamiento?</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">Aprobación rápida</h3>
                      <p class="text-gray-600">Respuesta en menos de 24 horas con documentación mínima requerida.</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">Tasas competitivas</h3>
                      <p class="text-gray-600">Las mejores tasas del mercado desde 12% anual con historial crediticio favorable.</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">Plazos flexibles</h3>
                      <p class="text-gray-600">Desde 12 hasta 60 meses para adaptarse a tu presupuesto mensual.</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">Sin penalizaciones</h3>
                      <p class="text-gray-600">Puedes liquidar anticipadamente sin penalizaciones ni comisiones adicionales.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Requisitos -->
              <div class="bg-white rounded-3xl p-8 shadow-sm">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Requisitos para el financiamiento</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Documentación personal</h3>
                    <ul class="space-y-2 text-gray-600">
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Identificación oficial vigente
                      </li>
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Comprobante de domicilio (máximo 3 meses)
                      </li>
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Comprobante de ingresos
                      </li>
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Referencias personales
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Requisitos financieros</h3>
                    <ul class="space-y-2 text-gray-600">
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Ingresos mínimos de $15,000 mensuales
                      </li>
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Antigüedad laboral mínima de 6 meses
                      </li>
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Historial crediticio favorable
                      </li>
                      <li class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Edad entre 18 y 70 años
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
              
              <!-- Formulario de solicitud -->
              <div class="bg-white rounded-3xl p-6 shadow-sm sticky top-8">
                <h3 class="text-xl font-bold text-gray-900 mb-4">Solicitar Financiamiento</h3>
                
                <form class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
                    <input 
                      type="text" 
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tu nombre completo"
                      required
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input 
                      type="tel" 
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tu número de teléfono"
                      required
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input 
                      type="email" 
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="tu@email.com"
                      required
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Monto a financiar</label>
                    <input 
                      type="number" 
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: 350000"
                    >
                  </div>
                  
                  <button 
                    type="submit"
                    class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                  >
                    Solicitar Financiamiento
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
export class FinancingComponent {
  calculatorData = {
    vehiclePrice: 500000,
    downPaymentPercentage: 30,
    termMonths: 48,
    interestRate: 12.5
  };

  updateCalculations() {
    // Los cálculos se actualizan automáticamente con los getters
  }

  getDownPayment(): number {
    return (this.calculatorData.vehiclePrice * this.calculatorData.downPaymentPercentage) / 100;
  }

  getFinancedAmount(): number {
    return this.calculatorData.vehiclePrice - this.getDownPayment();
  }

  getMonthlyInterestRate(): number {
    return this.calculatorData.interestRate / 100 / 12;
  }

  getMonthlyPayment(): number {
    const principal = this.getFinancedAmount();
    const monthlyRate = this.getMonthlyInterestRate();
    const months = this.calculatorData.termMonths;
    
    if (monthlyRate === 0) {
      return principal / months;
    }
    
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  }

  getTotalAmount(): number {
    return this.getDownPayment() + (this.getMonthlyPayment() * this.calculatorData.termMonths);
  }
}
