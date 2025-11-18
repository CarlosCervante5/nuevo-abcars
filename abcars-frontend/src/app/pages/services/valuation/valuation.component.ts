import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../../shared/components/modern-footer/modern-footer.component';
import { VehicleService } from '../../../shared/services/vehicle.service';
import { Brand, BrandsResponse, Model, ModelsResponse } from '../../../shared/interfaces/vehicle_data.interface';
import { AdminService } from '../../../shared/services/admin.service';
import { Dealership, DealerShipResponse } from '../../../shared/interfaces/admin.interfaces';
import { AppointmentService } from '../../../shared/services/appointment.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-valuation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HomeNavComponent, ModernFooterComponent],
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
          <form [formGroup]="valuationForm" (ngSubmit)="submitValuation($event)">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- Columna principal -->
            <div class="lg:col-span-2 space-y-8">
              
              <!-- Formulario de valuación -->
              <div class="bg-white rounded-3xl p-8 shadow-sm">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Solicitar Valuación</h2>
                
                <div class="space-y-6">
                  <!-- Información del vehículo -->
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Información del Vehículo</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Marca *</label>
                        <input 
                          type="text"
                          formControlName="brand"
                          list="brands-list"
                          (input)="onBrandInput(valuationForm.get('brand')?.value || '')"
                          [class.border-red-500]="valuationForm.get('brand')?.invalid && valuationForm.get('brand')?.touched"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="Escribe o selecciona una marca"
                        >
                        <datalist id="brands-list">
                          <option *ngFor="let brand of brands" [value]="brand.name">
                        </datalist>
                        <p *ngIf="valuationForm.get('brand')?.invalid && valuationForm.get('brand')?.touched" class="mt-1 text-sm text-red-600">
                          La marca es requerida
                        </p>
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Modelo *</label>
                        <input 
                          type="text"
                          formControlName="model"
                          [attr.list]="models.length > 0 ? 'models-list' : null"
                          autocomplete="off"
                          [class.border-red-500]="valuationForm.get('model')?.invalid && valuationForm.get('model')?.touched"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="Escribe o selecciona un modelo"
                        >
                        <datalist *ngIf="models.length > 0" id="models-list">
                          <option *ngFor="let model of models" [value]="model.name">
                        </datalist>
                        <p *ngIf="valuationForm.get('model')?.invalid && valuationForm.get('model')?.touched" class="mt-1 text-sm text-red-600">
                          El modelo es requerido
                        </p>
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Año *</label>
                        <select 
                          formControlName="year"
                          [class.border-red-500]="valuationForm.get('year')?.invalid && valuationForm.get('year')?.touched"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="">Selecciona año</option>
                          <option *ngFor="let year of getYears()" [value]="year">{{ year }}</option>
                        </select>
                        <p *ngIf="valuationForm.get('year')?.invalid && valuationForm.get('year')?.touched" class="mt-1 text-sm text-red-600">
                          El año es requerido
                        </p>
                      </div>
                      
                      <!-- 
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
                      -->
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Kilometraje *</label>
                        <input 
                          type="number" 
                          formControlName="mileage"
                          [class.border-red-500]="valuationForm.get('mileage')?.invalid && valuationForm.get('mileage')?.touched"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="Ej: 50000"
                        >
                        <p *ngIf="valuationForm.get('mileage')?.invalid && valuationForm.get('mileage')?.touched" class="mt-1 text-sm text-red-600">
                          <span *ngIf="valuationForm.get('mileage')?.errors?.['required']">El kilometraje es requerido</span>
                          <span *ngIf="valuationForm.get('mileage')?.errors?.['pattern']">El kilometraje debe ser un número válido</span>
                        </p>
                      </div>
                      
                      <!-- 
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
                      -->
                    </div>
                  </div>

                </div>
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
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                    <input 
                      type="text" 
                      formControlName="fullName"
                      [class.border-red-500]="valuationForm.get('fullName')?.invalid && valuationForm.get('fullName')?.touched"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Tu nombre"
                    >
                    <p *ngIf="valuationForm.get('fullName')?.invalid && valuationForm.get('fullName')?.touched" class="mt-1 text-sm text-red-600">
                      El nombre es requerido
                    </p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Apellidos *</label>
                    <input 
                      type="text" 
                      formControlName="lastName"
                      [class.border-red-500]="valuationForm.get('lastName')?.invalid && valuationForm.get('lastName')?.touched"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Tus apellidos"
                    >
                    <p *ngIf="valuationForm.get('lastName')?.invalid && valuationForm.get('lastName')?.touched" class="mt-1 text-sm text-red-600">
                      Los apellidos son requeridos
                    </p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input 
                      type="tel" 
                      formControlName="phone"
                      maxlength="10"
                      (keypress)="onPhoneKeyPress($event)"
                      (input)="onPhoneInput($event)"
                      [class.border-red-500]="valuationForm.get('phone')?.invalid && valuationForm.get('phone')?.touched"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Tu número de teléfono"
                    >
                    <p *ngIf="valuationForm.get('phone')?.invalid && valuationForm.get('phone')?.touched" class="mt-1 text-sm text-red-600">
                      <span *ngIf="valuationForm.get('phone')?.errors?.['required']">El teléfono es requerido</span>
                      <span *ngIf="valuationForm.get('phone')?.errors?.['pattern']">El teléfono debe tener 10 dígitos</span>
                    </p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input 
                      type="email" 
                      formControlName="email"
                      [class.border-red-500]="valuationForm.get('email')?.invalid && valuationForm.get('email')?.touched"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="tu@email.com"
                    >
                    <p *ngIf="valuationForm.get('email')?.invalid && valuationForm.get('email')?.touched" class="mt-1 text-sm text-red-600">
                      <span *ngIf="valuationForm.get('email')?.errors?.['required']">El email es requerido</span>
                      <span *ngIf="valuationForm.get('email')?.errors?.['email']">El email no es válido</span>
                    </p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Sucursal *</label>
                    <select 
                      formControlName="city"
                      [class.border-red-500]="valuationForm.get('city')?.invalid && valuationForm.get('city')?.touched"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Selecciona sucursal</option>
                      <option *ngFor="let dealership of dealerships" [value]="dealership.name">{{ dealership.name }}</option>
                    </select>
                    <p *ngIf="valuationForm.get('city')?.invalid && valuationForm.get('city')?.touched" class="mt-1 text-sm text-red-600">
                      La sucursal es requerida
                    </p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de cita *</label>
                    <input 
                      type="date" 
                      formControlName="preferredDate"
                      [class.border-red-500]="valuationForm.get('preferredDate')?.invalid && valuationForm.get('preferredDate')?.touched"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                    <p *ngIf="valuationForm.get('preferredDate')?.invalid && valuationForm.get('preferredDate')?.touched" class="mt-1 text-sm text-red-600">
                      La fecha de cita es requerida
                    </p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Hora de cita *</label>
                    <select 
                      formControlName="preferredTime"
                      [class.border-red-500]="valuationForm.get('preferredTime')?.invalid && valuationForm.get('preferredTime')?.touched"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Selecciona hora</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="18:00">6:00 PM</option>
                    </select>
                    <p *ngIf="valuationForm.get('preferredTime')?.invalid && valuationForm.get('preferredTime')?.touched" class="mt-1 text-sm text-red-600">
                      La hora de cita es requerida
                    </p>
                  </div>
                  
                  <button 
                    type="submit"
                    [disabled]="isSubmitting"
                    class="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-colors"
                  >
                    <span *ngIf="!isSubmitting">Solicitar Valuación Gratuita</span>
                    <span *ngIf="isSubmitting">Enviando...</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
          </form>
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
export class ValuationComponent implements OnInit {
  brands: Brand[] = [];
  dealerships: Dealership[] = [];
  models: Model[] = [];
  valuationForm: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private vehicleService: VehicleService,
    private adminService: AdminService,
    private appointmentService: AppointmentService,
    private fb: FormBuilder
  ) {
    this.valuationForm = this.fb.group({
      // Información del vehículo
      brand: ['', Validators.required],
      model: ['', Validators.required],
      year: ['', Validators.required],
      mileage: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      // Información de contacto
      fullName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.required, Validators.email]],
      city: ['', Validators.required],
      preferredDate: ['', Validators.required],
      preferredTime: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.getBrands();
    this.getDealerships();
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

  getDealerships(): void {
    this.adminService.getDealerships().subscribe({
      next: (response: DealerShipResponse) => {
        this.dealerships = response.data;
      },
      error: (error) => {
        console.error('Error al cargar sucursales:', error);
      }
    });
  }

  onBrandInput(brand: string): void {
    // Si el valor coincide con una marca de la API, cargar modelos
    const foundBrand = this.brands.find(b => b.name.toLowerCase() === brand.toLowerCase());
    
    if (foundBrand) {
      this.onBrandSelected(foundBrand.name);
    } else {
      // Si no coincide, limpiar modelos
      this.models = [];
      this.valuationForm.patchValue({ model: '' });
    }
  }

  onBrandSelected(brand: string): void {
    // Limpiar modelo anterior
    this.valuationForm.patchValue({ model: '' });
    this.models = [];

    if (!brand) {
      return;
    }

    this.vehicleService.getModelsByBrand(brand).subscribe({
      next: (response: ModelsResponse) => {
        this.models = response.data.line_models;
      },
      error: (error) => {
        console.error('Error al cargar modelos:', error);
        this.models = [];
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) {
      return '';
    }
    // Asegurarse de que la fecha esté en formato YYYY-MM-DD
    const [year, month, day] = dateString.split('-');
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
  }

  onPhoneKeyPress(event: KeyboardEvent): void {
    // Solo permitir números (0-9)
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Remover cualquier carácter que no sea número
    const value = input.value.replace(/\D/g, '');
    // Limitar a 10 dígitos
    const limitedValue = value.slice(0, 10);
    // Actualizar el valor del formulario
    this.valuationForm.patchValue({ phone: limitedValue }, { emitEvent: false });
  }

  getYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 30; i--) {
      years.push(i);
    }
    return years;
  }

  submitValuation(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    
    // Validar formulario
    if (this.valuationForm.invalid || this.isSubmitting) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.valuationForm.controls).forEach(key => {
        this.valuationForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    const formValue = this.valuationForm.value;
    
    // Construir objeto para registro del cliente
    const clientData = {
      name: formValue.fullName || '',
      last_name: formValue.lastName || '',
      email: formValue.email || '',
      phone_1: formValue.phone || ''
    };

    // Crear FormGroup temporal para el cliente
    const clientForm = this.fb.group(clientData);

    // Paso 1: Registrar el cliente
    this.adminService.setRiders(clientForm).subscribe({
      next: (response) => {
        // Verificar que la respuesta tenga la estructura esperada
        if (response && response.data && response.data.profile && response.data.profile.uuid) {
          const customerUuid = response.data.profile.uuid;
          
          // Hacer patchValue al formulario con el customer_uuid
          this.valuationForm.patchValue({ customer_uuid: customerUuid });

          // Construir scheduled_date con formato YYYY-MM-DD HH:MM
          const formattedDate = formValue.preferredDate ? this.formatDate(formValue.preferredDate) : '';
          const scheduledDateTime = formattedDate && formValue.preferredTime
            ? `${formattedDate} ${formValue.preferredTime}`
            : '';

          // Construir objeto para la cita de valuación
          const appointmentData = {
            type: 'valuation',
            customer_uuid: customerUuid,
            brand_name: formValue.brand || '',
            model_name: formValue.model || '',
            year: formValue.year || '',
            mileage: formValue.mileage ? String(formValue.mileage) : '0',
            scheduled_date: scheduledDateTime,
            dealership_name: formValue.city || ''
          };

          // Crear FormGroup temporal para la cita
          const appointmentForm = this.fb.group(appointmentData);

          // Paso 2: Crear la cita de valuación
          this.appointmentService.setExternalAppointmentValuation(appointmentForm).subscribe({
            next: (appointmentResponse) => {
              this.isSubmitting = false;
              
              // Mostrar mensaje de éxito
              Swal.fire({
                icon: 'success',
                title: 'Cita creada exitosamente',
                timer: 2000,
                showConfirmButton: false
              }).then(() => {
                // Recargar la página
                window.location.reload();
              });
            },
            error: (error) => {
              this.isSubmitting = false;
              
              // Mostrar mensaje de error
              Swal.fire({
                icon: 'error',
                title: 'Lo sentimos, hubo un error',
                text: 'Hubo un problema al procesar la solicitud, inténtelo más tarde. ' + (error?.error?.message || error?.message || '')
              });
            }
          });
        } else {
          this.isSubmitting = false;
          Swal.fire({
            icon: 'error',
            title: 'Lo sentimos, hubo un error',
            text: 'No se pudo obtener el identificador del cliente. Por favor, inténtelo más tarde.'
          });
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        
        // Mostrar mensaje de error
        Swal.fire({
          icon: 'error',
          title: 'Lo sentimos, hubo un error',
          text: 'Hubo un problema al procesar la solicitud, inténtelo más tarde. ' + (error?.error?.message || error?.message || '')
        });
      }
    });
  }
}
