import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../../shared/components/modern-footer/modern-footer.component';
import { VehicleService } from '../../../shared/services/vehicle.service';
import { Brand, BrandsResponse } from '../../../shared/interfaces/vehicle_data.interface';
import { StregaService } from '../../../shared/services/strega.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-insurance',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HomeNavComponent, ModernFooterComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navbar -->
      <app-home-nav></app-home-nav>
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-green-600 to-green-800 text-white py-16 pt-32">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-4xl lg:text-5xl font-bold mb-4">Seguros Automotrices</h1>
            <p class="text-xl text-green-100 mb-8">Protege tu inversión con las mejores coberturas y precios del mercado</p>
            <div class="flex flex-wrap justify-center gap-4 text-sm">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Cobertura completa</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Asistencia 24/7</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Precios competitivos</span>
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
              
              <!-- Cotizador de seguros -->
              <div class="bg-white rounded-3xl p-8 shadow-sm">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Cotizador de Seguros</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Marca del vehículo</label>
                    <select 
                      [(ngModel)]="quoteData.brand"
                      (change)="updateQuote()"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Selecciona marca</option>
                      <option *ngFor="let brand of brands" [value]="brand.name">{{ brand.name }}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
                    <input 
                      type="text" 
                      [(ngModel)]="quoteData.model"
                      (input)="updateQuote()"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ej: Corolla"
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Año</label>
                    <select 
                      [(ngModel)]="quoteData.year"
                      (change)="updateQuote()"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Selecciona año</option>
                      <option *ngFor="let year of getYears()" [value]="year">{{ year }}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Valor comercial</label>
                    <input 
                      type="number" 
                      [(ngModel)]="quoteData.value"
                      (input)="updateQuote()"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ej: 250000"
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Uso del vehículo</label>
                    <select 
                      [(ngModel)]="quoteData.usage"
                      (change)="updateQuote()"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Selecciona uso</option>
                      <option value="particular">Particular</option>
                      <option value="comercial">Comercial</option>
                      <option value="taxi">Taxi</option>
                      <option value="uber">Uber/Didi</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Código postal</label>
                    <input 
                      type="text" 
                      [(ngModel)]="quoteData.zipCode"
                      (input)="updateQuote()"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ej: 03100"
                    >
                  </div>
                </div>
                
                <!-- Resultado de cotización -->
                <div *ngIf="quoteResult" class="mt-8 p-6 bg-green-50 rounded-2xl">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Tu cotización</h3>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="text-center">
                      <div class="text-2xl font-bold text-green-600">MXN {{ quoteResult.basic | number }}</div>
                      <div class="text-sm text-gray-600">Cobertura básica</div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl font-bold text-green-600">MXN {{ quoteResult.standard | number }}</div>
                      <div class="text-sm text-gray-600">Cobertura estándar</div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl font-bold text-green-600">MXN {{ quoteResult.premium | number }}</div>
                      <div class="text-sm text-gray-600">Cobertura premium</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tipos de cobertura -->
              <div class="bg-white rounded-3xl p-8 shadow-sm">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Tipos de Cobertura</h2>
                
                <div class="space-y-6">
                  <!-- Cobertura básica -->
                  <div class="border border-gray-200 rounded-2xl p-6">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="text-xl font-semibold text-gray-900">Cobertura Básica</h3>
                      <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Recomendada</span>
                    </div>
                    <p class="text-gray-600 mb-4">Protección esencial para tu vehículo con las coberturas más importantes.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span class="text-sm text-gray-600">Responsabilidad civil</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span class="text-sm text-gray-600">Gastos médicos</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span class="text-sm text-gray-600">Defensa legal</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span class="text-sm text-gray-600">Asistencia vial</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Cobertura estándar -->
                  <div class="border border-gray-200 rounded-2xl p-6">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="text-xl font-semibold text-gray-900">Cobertura Estándar</h3>
                      <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Popular</span>
                    </div>
                    <p class="text-gray-600 mb-4">Protección completa que incluye daños a terceros y robo total.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span class="text-sm text-gray-600">Todo lo de la básica</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span class="text-sm text-gray-600">Robo total</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span class="text-sm text-gray-600">Incendio</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span class="text-sm text-gray-600">Fenómenos hidrometeorológicos</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Cobertura premium -->
                  <div class="border border-gray-200 rounded-2xl p-6">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="text-xl font-semibold text-gray-900">Cobertura Premium</h3>
                      <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">Completa</span>
                    </div>
                    <p class="text-gray-600 mb-4">La máxima protección para tu vehículo con cobertura amplia.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span class="text-sm text-gray-600">Todo lo de la estándar</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span class="text-sm text-gray-600">Daños materiales</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span class="text-sm text-gray-600">Cristales</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span class="text-sm text-gray-600">Equipaje</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Beneficios adicionales -->
              <div class="bg-white rounded-3xl p-8 shadow-sm">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Beneficios Adicionales</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">Asistencia 24/7</h3>
                      <p class="text-gray-600">Servicio de grúa, paso de corriente, cambio de llanta y más, disponible las 24 horas.</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">Reparación en red</h3>
                      <p class="text-gray-600">Más de 1,500 talleres en toda la república para reparaciones sin costo adicional.</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">Vehículo de reemplazo</h3>
                      <p class="text-gray-600">Auto de reemplazo mientras tu vehículo está en reparación por siniestro.</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">Descuentos por no siniestro</h3>
                      <p class="text-gray-600">Hasta 50% de descuento en tu renovación si no tienes siniestros.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
              
              <!-- Formulario de cotización -->
              <div class="bg-white rounded-3xl p-6 shadow-sm sticky top-8">
                <h3 class="text-xl font-bold text-gray-900 mb-4">Solicitar Cotización</h3>
                
                <form [formGroup]="insuranceForm" (ngSubmit)="onSubmitInsurance()" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                    <input 
                      type="text" 
                      formControlName="name"
                      class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      [class.border-gray-300]="!insuranceForm.get('name')?.invalid || !insuranceForm.get('name')?.touched"
                      [class.border-red-500]="insuranceForm.get('name')?.invalid && insuranceForm.get('name')?.touched"
                      placeholder="Tu nombre"
                    >
                    <p *ngIf="insuranceForm.get('name')?.invalid && insuranceForm.get('name')?.touched" class="text-red-500 text-xs mt-1">
                      El nombre es requerido
                    </p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Apellidos *</label>
                    <input 
                      type="text" 
                      formControlName="last_name"
                      class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      [class.border-gray-300]="!insuranceForm.get('last_name')?.invalid || !insuranceForm.get('last_name')?.touched"
                      [class.border-red-500]="insuranceForm.get('last_name')?.invalid && insuranceForm.get('last_name')?.touched"
                      placeholder="Tus apellidos"
                    >
                    <p *ngIf="insuranceForm.get('last_name')?.invalid && insuranceForm.get('last_name')?.touched" class="text-red-500 text-xs mt-1">
                      Los apellidos son requeridos
                    </p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input 
                      type="tel" 
                      formControlName="phone"
                      maxlength="10"
                      pattern="[0-9]{10}"
                      inputmode="numeric"
                      class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      [class.border-gray-300]="!insuranceForm.get('phone')?.invalid || !insuranceForm.get('phone')?.touched"
                      [class.border-red-500]="insuranceForm.get('phone')?.invalid && insuranceForm.get('phone')?.touched"
                      placeholder="10 dígitos"
                    >
                    <p *ngIf="insuranceForm.get('phone')?.invalid && insuranceForm.get('phone')?.touched" class="text-red-500 text-xs mt-1">
                      <span *ngIf="insuranceForm.get('phone')?.errors?.['required']">El teléfono es requerido</span>
                      <span *ngIf="insuranceForm.get('phone')?.errors?.['pattern'] && !insuranceForm.get('phone')?.errors?.['required']">El teléfono debe tener exactamente 10 dígitos</span>
                    </p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input 
                      type="email" 
                      formControlName="email"
                      class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      [class.border-gray-300]="!insuranceForm.get('email')?.invalid || !insuranceForm.get('email')?.touched"
                      [class.border-red-500]="insuranceForm.get('email')?.invalid && insuranceForm.get('email')?.touched"
                      placeholder="tu@email.com"
                    >
                    <p *ngIf="insuranceForm.get('email')?.invalid && insuranceForm.get('email')?.touched" class="text-red-500 text-xs mt-1">
                      <span *ngIf="insuranceForm.get('email')?.errors?.['required']">El email es requerido</span>
                      <span *ngIf="insuranceForm.get('email')?.errors?.['email'] && !insuranceForm.get('email')?.errors?.['required']">El email no es válido</span>
                    </p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de cobertura *</label>
                    <select 
                      formControlName="coverageType"
                      class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      [class.border-gray-300]="!insuranceForm.get('coverageType')?.invalid || !insuranceForm.get('coverageType')?.touched"
                      [class.border-red-500]="insuranceForm.get('coverageType')?.invalid && insuranceForm.get('coverageType')?.touched"
                    >
                      <option value="">Selecciona cobertura</option>
                      <option value="basica">Básica</option>
                      <option value="estandar">Estándar</option>
                      <option value="premium">Premium</option>
                    </select>
                    <p *ngIf="insuranceForm.get('coverageType')?.invalid && insuranceForm.get('coverageType')?.touched" class="text-red-500 text-xs mt-1">
                      El tipo de cobertura es requerido
                    </p>
                  </div>
                  
                  <button 
                    type="submit"
                    [disabled]="isSubmitting"
                    class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <span *ngIf="!isSubmitting">Solicitar Cotización</span>
                    <span *ngIf="isSubmitting">Enviando...</span>
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
export class InsuranceComponent implements OnInit {
  brands: Brand[] = [];
  
  quoteData = {
    brand: '',
    model: '',
    year: '',
    value: 0,
    usage: '',
    zipCode: ''
  };

  quoteResult: any = null;

  insuranceForm: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private vehicleService: VehicleService,
    private fb: FormBuilder,
    private stregaService: StregaService
  ) {
    this.insuranceForm = this.fb.group({
      name: ['', Validators.required],
      last_name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.required, Validators.email]],
      coverageType: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.getBrands();
  }

  getBrands(): void {
    this.vehicleService.getBrands().subscribe({
      next: (response: BrandsResponse) => {
        this.brands = response.data.vehicle_brands;
      },
      error: (error) => {
        console.error('Error al cargar marcas:', error);
      }
    });
  }

  getYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 20; i--) {
      years.push(i);
    }
    return years;
  }

  updateQuote() {
    if (this.quoteData.brand && this.quoteData.model && this.quoteData.year && this.quoteData.value) {
      // Simulación de cálculo de cotización
      const baseRate = this.quoteData.value * 0.05; // 5% del valor del vehículo
      
      this.quoteResult = {
        basic: Math.round(baseRate * 0.6),
        standard: Math.round(baseRate * 0.8),
        premium: Math.round(baseRate * 1.2)
      };
    } else {
      this.quoteResult = null;
    }
  }

  getCoverageAmount(): number {
    if (!this.quoteResult) return 0;
    
    const coverageType = this.insuranceForm.value.coverageType;
    if (coverageType === 'basica') return this.quoteResult.basic;
    if (coverageType === 'estandar') return this.quoteResult.standard;
    if (coverageType === 'premium') return this.quoteResult.premium;
    return 0;
  }

  buildQComments(coverageAmount: number): string {
    const coverageTypeText = this.insuranceForm.value.coverageType === 'basica' ? 'Básica' :
                             this.insuranceForm.value.coverageType === 'estandar' ? 'Estándar' :
                             this.insuranceForm.value.coverageType === 'premium' ? 'Premium' : '';

    return `Marca: ${this.quoteData.brand}, Modelo: ${this.quoteData.model}, Año: ${this.quoteData.year}, Valor comercial: $${this.quoteData.value.toLocaleString()} MXN, Tipo de cobertura: ${coverageTypeText}, Monto de la cobertura elegida: $${coverageAmount.toLocaleString()} MXN`;
  }

  onSubmitInsurance() {
    if (this.insuranceForm.invalid || this.isSubmitting) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.insuranceForm.controls).forEach(key => {
        this.insuranceForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    // Obtener monto de cobertura según tipo seleccionado
    const coverageAmount = this.getCoverageAmount();
    
    // Construir q_comments
    const qComments = this.buildQComments(coverageAmount);
    
    // Preparar datos con campos adicionales para enviar
    const formData = {
      ...this.insuranceForm.value,
      q_model_interest: '',
      q_brand_interest: '',
      q_initial_investment: String(coverageAmount),
      q_time_to_buy: '',
      q_comments: qComments,
      opportunity_type: 'lead',
      dealership_name: 'Chevrolet Serdán',
      campaign_name: 'Página ABCars',
      campaign_channel: 'WEB ABCars',
      campaign_source: 'Solicitud de cotización de seguros'
    };

    // Crear FormGroup temporal solo para cumplir con la firma del servicio
    const formToSend = this.fb.group(formData);

    this.stregaService.createLead(formToSend).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        
        // Limpiar formulario de solicitud
        this.insuranceForm.reset();
        
        // Limpiar cotizador de seguros
        this.quoteData = {
          brand: '',
          model: '',
          year: '',
          value: 0,
          usage: '',
          zipCode: ''
        };
        
        // Limpiar resultados de cotización
        this.quoteResult = null;
        
        Swal.fire({
          icon: 'success',
          title: '¡Solicitud enviada!',
          text: 'Tu solicitud de cotización de seguros ha sido enviada exitosamente. Nos pondremos en contacto contigo pronto.',
          showConfirmButton: true,
          confirmButtonColor: '#10b981',
          timer: 5000
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        
        console.error('Error al enviar solicitud:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al enviar tu solicitud. Por favor, intenta de nuevo más tarde.',
          showConfirmButton: true,
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }
}
