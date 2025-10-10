import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ScrollService } from '../../services/scroll.service';

@Component({
  selector: 'app-dark-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Navigation para otras vistas - Siempre fondo blanco con texto negro -->
    <nav 
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div class="w-full mx-auto px-12 lg:px-16">
        <div class="flex justify-between items-center h-24">
          
          <!-- Logo Section -->
          <a [routerLink]="['/']" class="flex items-center space-x-3">
            <img src="../assets/images/logo.svg" class="h-10 transition-all" alt="ABCars Logo">
          </a>

          <!-- Desktop Navigation Links -->
          <div class="hidden lg:flex items-center space-x-8">
            <a [routerLink]="['/inventario']" class="nav-link text-gray-700 hover:text-yellow-600" (click)="scrollToTop()">Vehículos</a>
            <a [routerLink]="['/servicios']" class="nav-link text-gray-700 hover:text-yellow-600" (click)="scrollToTop()">Servicios</a>
            <a [routerLink]="['/financiamiento']" class="nav-link text-gray-700 hover:text-yellow-600" (click)="scrollToTop()">Financiamiento</a>
          </div>

          <!-- Action Buttons -->
          <div class="hidden lg:flex items-center space-x-4">
            <a [routerLink]="['/auth/iniciar-sesion']" 
               class="btn-text text-gray-700 hover:text-yellow-600">
              Iniciar Sesión
            </a>
            <a [routerLink]="['/auth/registrarse']" 
               class="btn-primary">
              Registrarse
            </a>
          </div>

          <!-- Mobile Menu Button -->
          <div class="lg:hidden">
            <button class="mobile-menu-btn text-gray-700" (click)="toggleMobileMenu()">
              <svg *ngIf="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
              <svg *ngIf="mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

        </div>
      </div>

      <!-- Mobile Menu -->
      <div class="mobile-menu" [class.active]="mobileMenuOpen">
        <a [routerLink]="['/inventario']" class="mobile-menu-item" (click)="closeMobileMenu(); scrollToTop()">Vehículos</a>
        <a [routerLink]="['/servicios']" class="mobile-menu-item" (click)="closeMobileMenu(); scrollToTop()">Servicios</a>
        <a [routerLink]="['/financiamiento']" class="mobile-menu-item" (click)="closeMobileMenu(); scrollToTop()">Financiamiento</a>
        <div class="border-t border-gray-200 pt-4 mt-4">
          <a [routerLink]="['/auth/iniciar-sesion']" class="btn-text w-full text-gray-700 hover:text-yellow-600" (click)="closeMobileMenu(); scrollToTop()">
            Iniciar Sesión
          </a>
          <a [routerLink]="['/auth/registrarse']" class="btn-primary w-full mt-2" (click)="closeMobileMenu(); scrollToTop()">
            Registrarse
          </a>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .nav-link {
      @apply text-xl font-semibold transition-colors duration-300;
    }
    .btn-text {
      @apply px-4 py-2 font-semibold transition-colors duration-300 text-lg;
    }
    .btn-primary {
      @apply px-6 py-2.5 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-all duration-300 text-lg;
    }
    .mobile-menu-btn {
      @apply p-2 rounded-lg transition-colors duration-200;
    }
    .mobile-menu {
      @apply lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg shadow-xl transform -translate-y-full opacity-0 invisible transition-all duration-300;
      padding: 1.5rem;
    }
    .mobile-menu.active {
      @apply translate-y-0 opacity-100 visible;
    }
    .mobile-menu-item {
      @apply block py-3 text-lg font-semibold text-gray-700 hover:text-yellow-600 transition-colors duration-200 text-center;
    }
  `]
})
export class DarkNavComponent implements OnInit {
  mobileMenuOpen = false;

  constructor(private router: Router, private scrollService: ScrollService) {}

  ngOnInit() {
    // No necesitamos manejar scroll en este componente
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  scrollToTop(): void {
    this.scrollService.scrollToTop();
  }
} 