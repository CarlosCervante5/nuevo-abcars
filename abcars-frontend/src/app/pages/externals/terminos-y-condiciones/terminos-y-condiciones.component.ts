import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ModernFooterComponent } from '../../../shared/components/modern-footer/modern-footer.component';
import { DarkNavComponent } from "@components/dark-nav/dark-nav.component";

@Component({
  selector: 'app-terminos-y-condiciones',
  standalone: true,
  imports: [CommonModule, RouterModule, ModernFooterComponent, DarkNavComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navbar -->
      <app-dark-nav></app-dark-nav>
      <!-- Contenido principal -->
      <div class="container mx-auto px-4 py-16" style="margin-top: 70px;">
        <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-6">Términos y Condiciones</h1>

          <p class="text-gray-700 mb-6 leading-relaxed">
            <!-- Contenido a completar -->
            Los términos y condiciones de uso establecen las reglas y regulaciones para el uso del sitio web y los servicios de ABCars.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">1. ACEPTACIÓN DE LOS TÉRMINOS</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            <!-- Contenido a completar -->
            Al acceder y utilizar este sitio web, usted acepta cumplir con estos términos y condiciones de uso.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">2. USO DEL SITIO WEB</h2>

          <p class="text-gray-700 mb-4 leading-relaxed">
            <!-- Contenido a completar -->
            El uso de este sitio web está sujeto a las siguientes condiciones:
          </p>

          <ul class="list-disc list-inside text-gray-700 mb-6 space-y-2 ml-4">
            <li>Usted debe ser mayor de edad para utilizar nuestros servicios.</li>
            <li>La información proporcionada debe ser veraz y precisa.</li>
            <li>No está permitido el uso del sitio para fines ilegales o no autorizados.</li>
            <li>El contenido del sitio está protegido por derechos de autor.</li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">3. PROPIEDAD INTELECTUAL</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            <!-- Contenido a completar -->
            Todo el contenido de este sitio web, incluyendo textos, gráficos, logotipos, iconos, imágenes y software, es propiedad de ABCars o de sus proveedores de contenido y está protegido por las leyes de derechos de autor.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">4. LIMITACIÓN DE RESPONSABILIDAD</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            <!-- Contenido a completar -->
            ABCars no será responsable de ningún daño directo, indirecto, incidental, especial o consecuente que resulte del uso o la imposibilidad de usar este sitio web.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">5. MODIFICACIONES</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            <!-- Contenido a completar -->
            ABCars se reserva el derecho de modificar estos términos y condiciones en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en el sitio web.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">6. CONTACTO</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            <!-- Contenido a completar -->
            Si tiene alguna pregunta sobre estos términos y condiciones, puede contactarnos a través de nuestro correo electrónico: contacto&#64;abcars.mx
          </p>

          <p class="text-gray-700 mb-6 leading-relaxed">
            <strong>Última actualización:</strong> <!-- Fecha a completar -->
          </p>
        </div>
      </div>

      <!-- Footer -->
      <app-modern-footer></app-modern-footer>
    </div>
  `,
  styles: [`
    /* Estilos adicionales si son necesarios */
  `]
})
export class TerminosYCondicionesComponent implements OnInit {
  ngOnInit(): void {
    // Scroll to top on component load
    window.scrollTo(0, 0);
  }
}

