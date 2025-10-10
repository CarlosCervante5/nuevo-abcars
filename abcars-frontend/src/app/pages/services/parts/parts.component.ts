import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../../shared/components/modern-footer/modern-footer.component';

@Component({
  selector: 'app-parts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HomeNavComponent, ModernFooterComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navbar -->
      <app-home-nav></app-home-nav>
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-16 pt-32">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-4xl lg:text-5xl font-bold mb-4">Refacciones Originales</h1>
            <p class="text-xl text-indigo-100 mb-8">Refacciones 100% originales con garantía del fabricante</p>
            <div class="flex flex-wrap justify-center gap-4 text-sm">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>100% originales</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Garantía del fabricante</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Entrega rápida</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido principal -->
      <div class="container mx-auto px-4 py-16">
        <div class="max-w-6xl mx-auto">
          
          <!-- Filtros de búsqueda -->
          <div class="bg-white rounded-3xl p-8 shadow-sm mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Buscar Refacciones</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                <select 
                  [(ngModel)]="searchFilters.brand"
                  (change)="filterParts()"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Todas las marcas</option>
                  <option value="toyota">Toyota</option>
                  <option value="honda">Honda</option>
                  <option value="nissan">Nissan</option>
                  <option value="volkswagen">Volkswagen</option>
                  <option value="chevrolet">Chevrolet</option>
                  <option value="ford">Ford</option>
                  <option value="hyundai">Hyundai</option>
                  <option value="kia">Kia</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select 
                  [(ngModel)]="searchFilters.category"
                  (change)="filterParts()"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Todas las categorías</option>
                  <option value="motor">Motor</option>
                  <option value="frenos">Frenos</option>
                  <option value="suspension">Suspensión</option>
                  <option value="electrico">Eléctrico</option>
                  <option value="transmision">Transmisión</option>
                  <option value="carroceria">Carrocería</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Buscar por nombre</label>
                <input 
                  type="text" 
                  [(ngModel)]="searchFilters.name"
                  (input)="filterParts()"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ej: Filtro de aceite"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Buscar por código</label>
                <input 
                  type="text" 
                  [(ngModel)]="searchFilters.code"
                  (input)="filterParts()"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ej: 12345-ABC"
                >
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- Columna principal -->
            <div class="lg:col-span-2">
              
              <!-- Resultados de búsqueda -->
              <div class="bg-white rounded-3xl p-8 shadow-sm">
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-2xl font-bold text-gray-900">Refacciones Disponibles</h2>
                  <span class="text-sm text-gray-500">{{ filteredParts.length }} resultados</span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div *ngFor="let part of filteredParts" class="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                    <div class="flex items-start gap-4">
                      <div class="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                        </svg>
                      </div>
                      <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ part.name }}</h3>
                        <p class="text-sm text-gray-600 mb-2">{{ part.description }}</p>
                        <div class="flex items-center gap-2 mb-2">
                          <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{{ part.brand }}</span>
                          <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">{{ part.category }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="text-lg font-bold text-indigo-600">MXN {{ part.price | number }}</span>
                          <span class="text-sm text-gray-500">{{ part.stock }} disponibles</span>
                        </div>
                        <div class="mt-3">
                          <button 
                            class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                          >
                            Solicitar Cotización
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Mensaje cuando no hay resultados -->
                <div *ngIf="filteredParts.length === 0" class="text-center py-12">
                  <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">No se encontraron refacciones</h3>
                  <p class="text-gray-600">Intenta ajustar los filtros de búsqueda o contacta con nosotros.</p>
                </div>
              </div>

              <!-- Categorías populares -->
              <div class="bg-white rounded-3xl p-8 shadow-sm mt-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Categorías Populares</h2>
                
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div *ngFor="let category of popularCategories" 
                       class="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                       (click)="selectCategory(category.name)">
                    <div class="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-4">
                      <svg class="w-6 h-6 text-white" [innerHTML]="category.icon"></svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ category.name }}</h3>
                    <p class="text-gray-600 text-sm">{{ category.count }} refacciones</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
              
              <!-- Formulario de solicitud -->
              <div class="bg-white rounded-3xl p-6 shadow-sm sticky top-8">
                <h3 class="text-xl font-bold text-gray-900 mb-4">Solicitar Refacción</h3>
                
                <form class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
                    <input 
                      type="text" 
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Tu nombre completo"
                      required
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input 
                      type="tel" 
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Tu número de teléfono"
                      required
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input 
                      type="email" 
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="tu@email.com"
                      required
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Código de refacción</label>
                    <input 
                      type="text" 
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ej: 12345-ABC"
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                    <textarea 
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows="3"
                      placeholder="Describe la refacción que necesitas..."
                    ></textarea>
                  </div>
                  
                  <button 
                    type="submit"
                    class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                  >
                    Solicitar Cotización
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
export class PartsComponent {
  searchFilters = {
    brand: '',
    category: '',
    name: '',
    code: ''
  };

  parts = [
    {
      name: 'Filtro de aceite',
      description: 'Filtro de aceite original para motor',
      brand: 'Toyota',
      category: 'Motor',
      code: '04152-YZZA1',
      price: 450,
      stock: 25
    },
    {
      name: 'Pastillas de freno delanteras',
      description: 'Pastillas de freno delanteras originales',
      brand: 'Honda',
      category: 'Frenos',
      code: '45022-SNA-A01',
      price: 1200,
      stock: 15
    },
    {
      name: 'Amortiguador trasero',
      description: 'Amortiguador trasero original',
      brand: 'Nissan',
      category: 'Suspensión',
      code: '56200-1EA0A',
      price: 2800,
      stock: 8
    },
    {
      name: 'Alternador',
      description: 'Alternador original 12V 90A',
      brand: 'Volkswagen',
      category: 'Eléctrico',
      code: '06H-903-025',
      price: 4500,
      stock: 5
    },
    {
      name: 'Filtro de aire',
      description: 'Filtro de aire del motor original',
      brand: 'Chevrolet',
      category: 'Motor',
      code: 'A1237C',
      price: 380,
      stock: 30
    },
    {
      name: 'Bomba de agua',
      description: 'Bomba de agua original para motor',
      brand: 'Ford',
      category: 'Motor',
      code: '8L2Z-8501-A',
      price: 1800,
      stock: 12
    }
  ];

  filteredParts = [...this.parts];

  popularCategories = [
    {
      name: 'Motor',
      count: 45,
      icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'
    },
    {
      name: 'Frenos',
      count: 32,
      icon: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>'
    },
    {
      name: 'Suspensión',
      count: 28,
      icon: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'
    },
    {
      name: 'Eléctrico',
      count: 35,
      icon: '<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>'
    },
    {
      name: 'Transmisión',
      count: 18,
      icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'
    },
    {
      name: 'Carrocería',
      count: 22,
      icon: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>'
    }
  ];

  filterParts() {
    this.filteredParts = this.parts.filter(part => {
      const matchesBrand = !this.searchFilters.brand || part.brand.toLowerCase() === this.searchFilters.brand.toLowerCase();
      const matchesCategory = !this.searchFilters.category || part.category.toLowerCase() === this.searchFilters.category.toLowerCase();
      const matchesName = !this.searchFilters.name || part.name.toLowerCase().includes(this.searchFilters.name.toLowerCase());
      const matchesCode = !this.searchFilters.code || part.code.toLowerCase().includes(this.searchFilters.code.toLowerCase());
      
      return matchesBrand && matchesCategory && matchesName && matchesCode;
    });
  }

  selectCategory(categoryName: string) {
    this.searchFilters.category = categoryName.toLowerCase();
    this.filterParts();
  }
}
