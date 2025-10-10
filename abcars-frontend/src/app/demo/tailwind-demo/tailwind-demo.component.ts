import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ModernNavComponent } from '../../shared/components/modern-nav/modern-nav.component';
import { ModernFooterComponent } from '../../shared/components/modern-footer/modern-footer.component';
import { VehicleCardTailwindComponent } from '../vehicle-card-tailwind/vehicle-card-tailwind.component';

@Component({
  selector: 'app-tailwind-demo',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    ModernNavComponent,
    ModernFooterComponent,
    VehicleCardTailwindComponent
  ],
  template: `
    <!-- Navegación Moderna -->
    <app-modern-nav></app-modern-nav>

    <!-- Contenido Principal con nuevo Hero Section -->
    <main class="bg-white">
      
      <!-- Hero Section -->
      <section 
        class="relative h-screen flex flex-col items-center justify-center text-center text-white p-6 overflow-hidden bg-cover bg-center"
        [style.backgroundImage]="heroBackgroundImage">
        
        <!-- Superposición oscura para legibilidad -->
        <div class="absolute inset-0 bg-black/60 z-0"></div>

        <!-- Contenido superpuesto -->
        <div class="relative z-10 flex flex-col items-center">
          <!-- Título Principal -->
          <h1 class="text-6xl md:text-8xl font-extrabold mb-4 text-shadow-lg animate-fade-in-down">
            La forma más inteligente<br>de comprar tu auto
          </h1>

          <!-- Subtítulo -->
          <p class="text-xl md:text-2xl max-w-3xl mb-10 text-shadow-md animate-fade-in-up">
            Busca entre miles de vehículos inspeccionados y recíbelo en la puerta de tu casa.
          </p>

          <!-- Buscador principal -->
          <div class="w-full max-w-3xl mx-auto animate-fade-in-up">
            <div class="relative">
              <input 
                type="text"
                placeholder="Buscar por marca, modelo o palabra clave..."
                class="w-full h-20 pl-8 pr-40 rounded-full text-xl text-gray-800 placeholder-gray-500 bg-white shadow-2xl focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all"
              >
              <button class="absolute top-2 right-2 h-16 w-36 bg-gradient-to-r from-primary-400 to-primary-500 text-white font-bold text-lg rounded-full hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300">
                Buscar
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Cómo Funciona Section -->
      <section class="py-24 bg-white">
        <div class="container mx-auto px-6 text-center">
          <h2 class="text-5xl md:text-6xl font-bold text-gray-800 mb-16">Comprar en ABCars es así de fácil</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-16">
            <!-- Paso 1 -->
            <div class="text-center">
              <div class="how-it-works-icon bg-primary-200 text-primary-600">
                <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <h3 class="text-3xl font-bold text-gray-800 mt-6 mb-3">1. Busca tu auto ideal</h3>
              <p class="text-xl text-gray-600">Explora nuestro inventario online y encuentra el que más te guste.</p>
            </div>
            <!-- Paso 2 -->
            <div class="text-center">
              <div class="how-it-works-icon bg-primary-200 text-primary-600">
                <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h3 class="text-3xl font-bold text-gray-800 mt-6 mb-3">2. Compra 100% online</h3>
              <p class="text-xl text-gray-600">Realiza el apartado, sube tus documentos y agenda la entrega desde tu sillón.</p>
            </div>
            <!-- Paso 3 -->
            <div class="text-center">
              <div class="how-it-works-icon bg-primary-200 text-primary-600">
                <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V8.618a1 1 0 01.553-.894L9 5m0 15V5m0 15a1 1 0 001.447.894L16 18m-6-9a1 1 0 011.447-.894L16 5m6 13.382V8.618a1 1 0 00-.553-.894L16 5m0 13v-5m0 0l-4-2m4 2l4-2"></path></svg>
              </div>
              <h3 class="text-3xl font-bold text-gray-800 mt-6 mb-3">3. Recíbelo en casa</h3>
              <p class="text-xl text-gray-600">Te lo llevamos a tu puerta. Pruébalo 7 días. Si no te enamora, lo devuelves.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Vehicles Section -->
      <section class="py-20 bg-white">
        <div class="container mx-auto px-6 text-center">
          
          <!-- Section Header -->
          <div class="mb-16">
            <h2 class="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
              Encuentra tu vehículo ideal
            </h2>
            <p class="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Cada vehículo es cuidadosamente seleccionado y verificado para garantizar 
              la mejor experiencia de compra.
            </p>
          </div>

          <!-- Vehicle Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <app-vehicle-card-tailwind 
              *ngFor="let vehicle of sampleVehicles; trackBy: trackByVehicle"
              [vehicle]="vehicle">
            </app-vehicle-card-tailwind>
          </div>

          <!-- View All Button -->
          <div class="text-center">
            <button class="btn-outline-primary">
              <span>Ver todos los vehículos</span>
              <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </button>
          </div>

        </div>
      </section>

      <!-- Beneficios ABCars Section -->
      <section class="py-24 bg-gray-50">
        <div class="container mx-auto px-6 text-center">
          <h2 class="text-5xl md:text-6xl font-bold text-gray-800 mb-4">La Diferencia ABCars</h2>
          <p class="text-xl md:text-2xl text-gray-600 mb-16">Tu tranquilidad es nuestra prioridad. Por eso, cada auto viene con:</p>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <!-- Beneficio 1 -->
            <div class="feature-card group">
              <div class="feature-icon bg-primary-200 text-primary-600"><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
              <h3 class="text-3xl font-bold text-gray-900 mb-3">Garantía de 7 Días</h3>
              <p class="text-2xl text-gray-600">Prueba tu nuevo auto. Si no te encanta, te lo cambiamos o devolvemos tu dinero.</p>
            </div>
            <!-- Beneficio 2 -->
            <div class="feature-card group">
              <div class="feature-icon bg-primary-200 text-primary-600"><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path></svg></div>
              <h3 class="text-3xl font-bold text-gray-900 mb-3">Financiamiento para todos</h3>
              <p class="text-2xl text-gray-600">Trabajamos con más de 15 instituciones para ofrecerte la mejor tasa.</p>
            </div>
            <!-- Beneficio 3 -->
            <div class="feature-card group">
              <div class="feature-icon bg-primary-200 text-primary-600"><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-2h8a1 1 0 001-1zM21 11.243l-1.484-.859a1 1 0 00-1.032.052l-1.89 1.303M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>
              <h3 class="text-3xl font-bold text-gray-900 mb-3">Entrega a Domicilio</h3>
              <p class="text-2xl text-gray-600">Recibe tu auto en la puerta de tu casa, sanitizado y listo para que lo disfrutes.</p>
            </div>
          </div>
        </div>
      </section>

    </main>

    <!-- Footer Moderno -->
    <app-modern-footer></app-modern-footer>
  `,
  styles: [`
    /* Cómo funciona */
    .how-it-works-icon {
      @apply w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all duration-300 transform group-hover:scale-110;
    }

    /* Features / Beneficios */
    .feature-card {
      @apply bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300;
    }
    .feature-icon {
      @apply w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center;
    }

    /* Outline Button */
    .btn-outline-primary {
      @apply flex items-center justify-center px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-full font-semibold text-lg hover:bg-primary-600 hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg;
    }
  `]
})
export class TailwindDemoComponent implements OnInit {
  
  heroBackgroundImage!: SafeStyle;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    // Usar la imagen local del showroom
    const imageUrl = '/assets/images/dealership-background.jpg';
    this.heroBackgroundImage = this.sanitizer.bypassSecurityTrustStyle(`url(${imageUrl})`);
  }

  sampleVehicles = [
    {
      id: 1,
      brand: 'BMW',
      model: 'X5',
      year: 2023,
      price: 1250000,
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500&h=300&fit=crop',
      fuel: 'Gasolina',
      transmission: 'Automática',
      mileage: 15000,
      location: 'Puebla, Pue.',
      features: ['Cuero', 'Sunroof', 'GPS', 'Cámara'],
      dealership: 'ABCars Puebla',
      status: 'available',
      isNew: false,
      certification: 'premium'
    },
    {
      id: 2,
      brand: 'Mercedes-Benz',
      model: 'C-Class',
      year: 2022,
      price: 950000,
      image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=500&h=300&fit=crop',
      fuel: 'Gasolina',
      transmission: 'Automática',
      mileage: 25000,
      location: 'CDMX',
      features: ['Cuero', 'Klimatizador', 'Bluetooth', 'Xenón'],
      dealership: 'ABCars CDMX',
      status: 'available',
      isNew: false,
      certification: 'certified'
    },
    {
      id: 3,
      brand: 'Audi',
      model: 'A4',
      year: 2024,
      price: 780000,
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=500&h=300&fit=crop',
      fuel: 'Gasolina',
      transmission: 'Automática',
      mileage: 0,
      location: 'Hidalgo',
      features: ['Virtual Cockpit', 'Cuero', 'Sunroof', 'Quattro'],
      dealership: 'ABCars Hidalgo',
      status: 'available',
      isNew: true,
      certification: 'new'
    }
  ];

  trackByVehicle(index: number, vehicle: any): number {
    return vehicle.id;
  }
} 