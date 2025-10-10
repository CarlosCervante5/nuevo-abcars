import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tailwind-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Hero Section -->
      <section class="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white py-20">
        <div class="container mx-auto px-4 text-center">
          <h1 class="text-5xl font-bold mb-6 animate-fade-in flex items-center justify-center gap-4">
            <svg class="w-12 h-12 text-yellow-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
            ABCars con <span class="text-yellow-200">Tailwind CSS</span>
          </h1>
          <p class="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Descubre nuestro nuevo diseño moderno y responsivo, construido con la potencia de Tailwind CSS
          </p>
          <div class="flex gap-4 justify-center">
            <button class="btn-abcars bg-white text-gray-900 hover:bg-gray-100">
              Ver Catálogo
            </button>
            <button class="btn-abcars-secondary border-white text-white hover:bg-white hover:text-gray-900">
              Conocer Más
            </button>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="py-16">
        <div class="container mx-auto px-4">
          <h2 class="text-3xl font-bold text-center mb-12 text-gray-900 flex items-center justify-center gap-2">
            <svg class="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Nuevas Características con Tailwind
          </h2>
          
          <div class="grid md:grid-cols-3 gap-8 mb-16">
            <div class="card-abcars text-center p-8 animate-slide-up">
              <div class="w-16 h-16 bg-gradient-abcars rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-3 text-gray-900">Diseño Moderno</h3>
              <p class="text-gray-600">
                Interfaz completamente rediseñada con componentes modernos y animaciones fluidas
              </p>
            </div>

            <div class="card-abcars text-center p-8 animate-slide-up animation-delay-200">
              <div class="w-16 h-16 bg-gradient-abcars rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-3 text-gray-900">Totalmente Responsivo</h3>
              <p class="text-gray-600">
                Perfecta experiencia en dispositivos móviles, tablets y escritorio
              </p>
            </div>

            <div class="card-abcars text-center p-8 animate-slide-up animation-delay-400">
              <div class="w-16 h-16 bg-gradient-abcars rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-3 text-gray-900">Rendimiento Optimizado</h3>
              <p class="text-gray-600">
                Carga más rápida y mejor rendimiento gracias a Tailwind CSS
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Comparison Section -->
      <section class="py-16 bg-gray-100">
        <div class="container mx-auto px-4">
          <h2 class="text-3xl font-bold text-center mb-12 text-gray-900 flex items-center justify-center gap-2">
            <svg class="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2 2H5V5h14v14z"/>
            </svg>
            Antes vs Después
          </h2>
          
          <div class="grid md:grid-cols-2 gap-8">
            <!-- Before -->
            <div class="bg-white rounded-2xl p-8 shadow-lg">
              <h3 class="text-2xl font-bold mb-6 text-red-600 flex items-center gap-2">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
                Con Angular Material
              </h3>
              <ul class="space-y-3">
                <li class="flex items-center text-gray-700">
                  <span class="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                  Diseño genérico y predefinido
                </li>
                <li class="flex items-center text-gray-700">
                  <span class="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                  Limitaciones de personalización
                </li>
                <li class="flex items-center text-gray-700">
                  <span class="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                  Bundle de CSS más pesado
                </li>
                <li class="flex items-center text-gray-700">
                  <span class="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                  Menos flexibilidad en responsive
                </li>
              </ul>
            </div>

            <!-- After -->
            <div class="bg-white rounded-2xl p-8 shadow-lg border-2 border-yellow-400">
              <h3 class="text-2xl font-bold mb-6 text-green-600 flex items-center gap-2">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Con Tailwind CSS
              </h3>
              <ul class="space-y-3">
                <li class="flex items-center text-gray-700">
                  <span class="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Diseño completamente personalizado
                </li>
                <li class="flex items-center text-gray-700">
                  <span class="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Control total sobre estilos
                </li>
                <li class="flex items-center text-gray-700">
                  <span class="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  CSS optimizado y más ligero
                </li>
                <li class="flex items-center text-gray-700">
                  <span class="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Responsive design avanzado
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-3xl font-bold mb-6 flex items-center justify-center gap-2">
            <svg class="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            ¿Listo para la nueva experiencia?
          </h2>
          <p class="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Explora nuestro catálogo completo con la nueva interfaz construida con Tailwind CSS
          </p>
          <button class="btn-abcars text-lg px-8 py-4">
            Explorar Catálogo Completo
          </button>
        </div>
      </section>
    </div>
  `
})
export class TailwindDemoComponent {
} 