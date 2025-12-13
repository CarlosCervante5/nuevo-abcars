import { Component, OnInit, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ScrollService } from '../../services/scroll.service';

@Component({
  selector: 'app-modern-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Navigation simplificada inspirada en Carvana -->
    <nav 
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      [ngClass]="isScrolled ? 'bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm' : 'bg-white/10 backdrop-blur-sm'">
      <div class="w-full mx-auto px-12 lg:px-16">
        <div class="flex justify-between items-center h-24">
          
          <!-- Logo Section -->
          <a [routerLink]="['/']" class="flex items-center space-x-3">
            <img src="../assets/images/logo.svg" class="h-10 transition-all" alt="ABCars Logo">
          </a>

          <!-- Desktop Navigation Links -->
          <div class="hidden lg:flex items-center space-x-8">
            <a [routerLink]="['/inventario']" class="nav-link" (click)="scrollToTop()" [ngClass]="(isScrolled || theme === 'dark') ? 'text-gray-700 hover:text-yellow-600' : 'text-white font-bold hover:text-yellow-300'">Vehículos</a>
            <a [routerLink]="['/servicios']" class="nav-link" (click)="scrollToTop()" [ngClass]="(isScrolled || theme === 'dark') ? 'text-gray-700 hover:text-yellow-600' : 'text-white font-bold hover:text-yellow-300'">Servicios</a>
            <a [routerLink]="['/financiamiento']" class="nav-link" (click)="scrollToTop()" [ngClass]="(isScrolled || theme === 'dark') ? 'text-gray-700 hover:text-yellow-600' : 'text-white font-bold hover:text-yellow-300'">Financiamiento</a>
          </div>

          <!-- Action Buttons -->
          <div class="hidden lg:flex items-center space-x-4">
            <a [routerLink]="['/auth/iniciar-sesion']" 
               class="btn-text"
               [ngClass]="(isScrolled || theme === 'dark') ? 'text-gray-700 hover:text-yellow-600' : 'text-white font-bold hover:text-yellow-300'">
              Iniciar Sesión
            </a>
            <a [routerLink]="['/auth/registrarse']" 
               class="btn-primary">
              Registrarse
            </a>
          </div>

          <!-- Mobile Menu Button -->
          <div class="lg:hidden">
            <button class="mobile-menu-btn" [ngClass]="(isScrolled || theme === 'dark') ? 'text-gray-700' : 'text-white font-bold'" (click)="toggleMobileMenu()">
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

      <!-- Mobile Sidebar Overlay -->
      <div 
        class="mobile-sidebar-overlay" 
        [class.active]="mobileMenuOpen"
        (click)="closeMobileMenu()">
      </div>

      <!-- Mobile Sidebar -->
      <div class="mobile-sidebar" [class.active]="mobileMenuOpen">
        <!-- Sidebar Header -->
        <div class="mobile-sidebar-header">
          <a [routerLink]="['/']" class="flex items-center space-x-3" (click)="closeMobileMenu(); scrollToTop()">
            <img src="../assets/images/logo.svg" class="h-10 transition-all" alt="ABCars Logo">
          </a>
          <button 
            class="mobile-sidebar-close-btn"
            (click)="closeMobileMenu()">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Sidebar Content -->
        <div class="mobile-sidebar-content">
          <!-- Navigation Links -->
          <nav class="mobile-sidebar-nav">
            <a 
              [routerLink]="['/inventario']" 
              class="mobile-sidebar-item" 
              (click)="closeMobileMenu(); scrollToTop()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              <span>Vehículos</span>
            </a>
            
            <a 
              [routerLink]="['/servicios']" 
              class="mobile-sidebar-item" 
              (click)="closeMobileMenu(); scrollToTop()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <span>Servicios</span>
            </a>
            
            <a 
              [routerLink]="['/financiamiento']" 
              class="mobile-sidebar-item" 
              (click)="closeMobileMenu(); scrollToTop()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Financiamiento</span>
            </a>
          </nav>

          <!-- Divider -->
          <div class="mobile-sidebar-divider"></div>

          <!-- Auth Section -->
          <div class="mobile-sidebar-auth">
            <a 
              [routerLink]="['/auth/iniciar-sesion']" 
              class="mobile-sidebar-item" 
              (click)="closeMobileMenu(); scrollToTop()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
              </svg>
              <span>Iniciar Sesión</span>
            </a>
            
            <a 
              [routerLink]="['/auth/registrarse']" 
              class="mobile-sidebar-item mobile-sidebar-item-primary" 
              (click)="closeMobileMenu(); scrollToTop()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
              </svg>
              <span>Registrarse</span>
            </a>
          </div>
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
    /* Mobile Sidebar Overlay */
    .mobile-sidebar-overlay {
      @apply lg:hidden fixed inset-0 bg-black/50 z-[60] opacity-0 invisible transition-opacity duration-300;
      top: 0;
    }
    .mobile-sidebar-overlay.active {
      @apply opacity-100 visible;
    }

    /* Mobile Sidebar */
    .mobile-sidebar {
      @apply lg:hidden fixed left-0 w-80 bg-white shadow-2xl z-[70] transform -translate-x-full transition-transform duration-300 ease-in-out;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }
    .mobile-sidebar.active {
      @apply translate-x-0;
    }

    /* Sidebar Header */
    .mobile-sidebar-header {
      @apply flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10;
    }
    .mobile-sidebar-close-btn {
      @apply p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200;
    }

    /* Sidebar Content */
    .mobile-sidebar-content {
      @apply flex flex-col p-4;
    }

    /* Sidebar Navigation */
    .mobile-sidebar-nav {
      @apply flex flex-col space-y-1;
    }

    /* Sidebar Item */
    .mobile-sidebar-item {
      @apply flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 rounded-lg transition-colors duration-200;
      @apply hover:bg-gray-100 hover:text-yellow-600;
    }
    .mobile-sidebar-item-primary {
      @apply bg-yellow-500 text-white hover:bg-yellow-600 hover:text-white;
    }

    /* Sidebar Divider */
    .mobile-sidebar-divider {
      @apply my-4 border-t border-gray-200;
    }

    /* Sidebar Auth Section */
    .mobile-sidebar-auth {
      @apply flex flex-col space-y-1;
    }
  `]
})
export class ModernNavComponent implements OnInit {
  @Input() theme: 'transparent' | 'dark' = 'transparent';

  mobileMenuOpen = false;
  isScrolled = false;

  constructor(private router: Router, private scrollService: ScrollService) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 10;
  }

  ngOnInit() {
    // Inicializar el estado de isScrolled en la carga
    this.onWindowScroll();
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (this.mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  // Método para hacer scroll to top
  scrollToTop(): void {
    this.scrollService.scrollToTop();
  }
} 