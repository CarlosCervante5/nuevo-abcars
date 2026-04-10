import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ScrollService } from '../../services/scroll.service';
import { AuthStateService } from '../../services/auth-state.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ReferralService } from '../../services/referral.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

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
            <a [routerLink]="['/inventario']" [queryParams]="referralLinkParams" class="nav-link text-gray-700 hover:text-yellow-600" (click)="scrollToTop()">Vehículos</a>
            <a [routerLink]="['/servicios']" [queryParams]="referralLinkParams" class="nav-link text-gray-700 hover:text-yellow-600" (click)="scrollToTop()">Servicios</a>
            <a [routerLink]="['/financiamiento']" [queryParams]="referralLinkParams" class="nav-link text-gray-700 hover:text-yellow-600" (click)="scrollToTop()">Simulador de Crédito</a>
          </div>

          <!-- Action Buttons Desktop -->
          <div class="hidden lg:flex items-center space-x-4">
            <!-- No autenticado: Mostrar Iniciar Sesión y Registrarse -->
            <ng-container *ngIf="!isAuthenticated">
              <a [routerLink]="['/auth/iniciar-sesion']" 
                 class="btn-text text-gray-700 hover:text-yellow-600">
                Iniciar Sesión
              </a>
              <a [routerLink]="['/auth/registrarse']" 
                 class="btn-primary">
                Registrarse
              </a>
            </ng-container>

            <!-- Autenticado: Mostrar Mi Cuenta con dropdown -->
            <div *ngIf="isAuthenticated" class="relative" (click)="$event.stopPropagation()">
              <button 
                class="btn-text flex items-center gap-2 text-gray-700 hover:text-yellow-600"
                (click)="toggleAccountDropdown()"
                type="button">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Mi Cuenta
                <svg class="w-4 h-4 transition-transform duration-200" [class.rotate-180]="accountDropdownOpen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

              <!-- Dropdown Menu -->
              <div 
                *ngIf="accountDropdownOpen"
                class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                (click)="$event.stopPropagation()">
                <a 
                  [routerLink]="[dashboardUrl]" 
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  (click)="closeAccountDropdown(); scrollToTop()">
                  Dashboard
                </a>
                <button 
                  type="button"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  (click)="logout()">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            </div>
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
              [queryParams]="referralLinkParams"
              class="mobile-sidebar-item" 
              (click)="closeMobileMenu(); scrollToTop()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              <span>Vehículos</span>
            </a>
            
            <a 
              [routerLink]="['/servicios']"
              [queryParams]="referralLinkParams"
              class="mobile-sidebar-item" 
              (click)="closeMobileMenu(); scrollToTop()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <span>Servicios</span>
            </a>
            
            <a 
              [routerLink]="['/financiamiento']"
              [queryParams]="referralLinkParams"
              class="mobile-sidebar-item" 
              (click)="closeMobileMenu(); scrollToTop()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Simulador de Crédito</span>
            </a>
          </nav>

          <!-- Divider -->
          <div class="mobile-sidebar-divider"></div>

          <!-- Auth Section -->
          <div class="mobile-sidebar-auth">
            <!-- No autenticado: Mostrar Iniciar Sesión y Registrarse -->
            <ng-container *ngIf="!isAuthenticated">
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
            </ng-container>

            <!-- Autenticado: Mostrar Mi Cuenta con opciones -->
            <div *ngIf="isAuthenticated" class="space-y-2">
              <button 
                type="button"
                class="mobile-sidebar-item w-full justify-between"
                (click)="toggleMobileAccountDropdown()">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  <span>Mi Cuenta</span>
                </div>
                <svg class="w-4 h-4 transition-transform duration-200" [class.rotate-180]="mobileAccountDropdownOpen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              <!-- Mobile Dropdown Options -->
              <div *ngIf="mobileAccountDropdownOpen" class="mobile-sidebar-dropdown">
                <a 
                  [routerLink]="[dashboardUrl]" 
                  class="mobile-sidebar-dropdown-item"
                  (click)="closeMobileMenu(); closeMobileAccountDropdown(); scrollToTop()">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  <span>Dashboard</span>
                </a>
                
                <button 
                  type="button"
                  class="mobile-sidebar-dropdown-item"
                  (click)="logout(); closeMobileMenu(); closeMobileAccountDropdown()">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
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

    /* Sidebar Dropdown */
    .mobile-sidebar-dropdown {
      @apply ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-4;
    }
    .mobile-sidebar-dropdown-item {
      @apply flex items-center gap-3 px-4 py-2 text-sm text-gray-600 rounded-lg transition-colors duration-200;
      @apply hover:bg-gray-100 hover:text-yellow-600;
    }
  `]
})
export class DarkNavComponent implements OnInit, OnDestroy {
  mobileMenuOpen = false;
  isAuthenticated = false;
  accountDropdownOpen = false;
  mobileAccountDropdownOpen = false;
  dashboardUrl = '/auth/mi-cuenta';
  private authSubscription?: Subscription;

  constructor(
    private router: Router, 
    private scrollService: ScrollService,
    private authStateService: AuthStateService,
    private authService: AuthService,
    private referralService: ReferralService
  ) {}

  /** Mantiene ?ref= al navegar (inventario → servicios → valuación). */
  get referralLinkParams(): Record<string, string> {
    return this.referralService.getReferralLinkQueryParams();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.accountDropdownOpen = false;
    }
  }

  ngOnInit() {
    // Suscribirse a cambios en el estado de autenticación
    this.authSubscription = this.authStateService.authState$.subscribe(authState => {
      this.isAuthenticated = authState.isAuthenticated;
      this.dashboardUrl = this.getDashboardUrl(authState.role);
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    document.body.style.overflow = '';
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (this.mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      this.mobileAccountDropdownOpen = false;
    }
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    this.mobileAccountDropdownOpen = false;
    document.body.style.overflow = '';
  }

  toggleAccountDropdown() {
    this.accountDropdownOpen = !this.accountDropdownOpen;
  }

  closeAccountDropdown() {
    this.accountDropdownOpen = false;
  }

  toggleMobileAccountDropdown() {
    this.mobileAccountDropdownOpen = !this.mobileAccountDropdownOpen;
  }

  closeMobileAccountDropdown() {
    this.mobileAccountDropdownOpen = false;
  }

  scrollToTop(): void {
    this.scrollService.scrollToTop();
  }

  getDashboardUrl(role: string | null): string {
    if (!role) {
      return '/auth/mi-cuenta';
    }

    if (role === 'client') {
      return '/auth/mi-cuenta';
    }

    return `/admin/${role}`;
  }

  logout(): void {
    this.authService.logout()
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Hasta luego!',
            text: 'Has cerrado sesión correctamente.',
            showConfirmButton: true,
            confirmButtonColor: '#EEB838',
            timer: 3500
          });
        },
        error: () => {
          // Incluso si hay error, limpiar el estado local
        }
      });

    // Limpiar el estado de autenticación
    this.authStateService.clearAuthState();
    this.accountDropdownOpen = false;
    this.mobileAccountDropdownOpen = false;
    
    // Redirigir al login
    this.router.navigate(['/auth/iniciar-sesion']);
  }
} 