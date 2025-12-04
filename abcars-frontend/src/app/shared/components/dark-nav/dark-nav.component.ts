import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ScrollService } from '../../services/scroll.service';
import { AuthStateService } from '../../services/auth-state.service';
import { AuthService } from '../../../auth/services/auth.service';
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
            <a [routerLink]="['/inventario']" class="nav-link text-gray-700 hover:text-yellow-600" (click)="scrollToTop()">Vehículos</a>
            <a [routerLink]="['/servicios']" class="nav-link text-gray-700 hover:text-yellow-600" (click)="scrollToTop()">Servicios</a>
            <a [routerLink]="['/financiamiento']" class="nav-link text-gray-700 hover:text-yellow-600" (click)="scrollToTop()">Financiamiento</a>
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

      <!-- Mobile Menu -->
      <div class="mobile-menu" [class.active]="mobileMenuOpen">
        <a [routerLink]="['/inventario']" class="mobile-menu-item" (click)="closeMobileMenu(); scrollToTop()">Vehículos</a>
        <a [routerLink]="['/servicios']" class="mobile-menu-item" (click)="closeMobileMenu(); scrollToTop()">Servicios</a>
        <a [routerLink]="['/financiamiento']" class="mobile-menu-item" (click)="closeMobileMenu(); scrollToTop()">Financiamiento</a>
        <div class="border-t border-gray-200 pt-4 mt-4">
          <!-- No autenticado: Mostrar Iniciar Sesión y Registrarse -->
          <ng-container *ngIf="!isAuthenticated">
            <a [routerLink]="['/auth/iniciar-sesion']" class="btn-text w-full text-gray-700 hover:text-yellow-600" (click)="closeMobileMenu(); scrollToTop()">
              Iniciar Sesión
            </a>
            <a [routerLink]="['/auth/registrarse']" class="btn-primary w-full mt-2" (click)="closeMobileMenu(); scrollToTop()">
              Registrarse
            </a>
          </ng-container>

          <!-- Autenticado: Mostrar Mi Cuenta con opciones -->
          <div *ngIf="isAuthenticated" class="space-y-2">
            <div class="relative">
              <button 
                type="button"
                class="btn-text w-full text-gray-700 hover:text-yellow-600 flex items-center justify-between"
                (click)="toggleMobileAccountDropdown()">
                <span class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Mi Cuenta
                </span>
                <svg class="w-4 h-4 transition-transform duration-200" [class.rotate-180]="mobileAccountDropdownOpen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              <!-- Mobile Dropdown Options -->
              <div *ngIf="mobileAccountDropdownOpen" class="mt-2 space-y-1 pl-4">
                <a 
                  [routerLink]="[dashboardUrl]" 
                  class="block py-2 text-sm text-gray-600 hover:text-yellow-600 transition-colors"
                  (click)="closeMobileMenu(); closeMobileAccountDropdown(); scrollToTop()">
                  Dashboard
                </a>
                <button 
                  type="button"
                  class="w-full text-left py-2 text-sm text-gray-600 hover:text-yellow-600 transition-colors flex items-center gap-2"
                  (click)="logout(); closeMobileMenu(); closeMobileAccountDropdown()">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  Cerrar Sesión
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
    private authService: AuthService
  ) {}

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
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (!this.mobileMenuOpen) {
      this.mobileAccountDropdownOpen = false;
    }
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    this.mobileAccountDropdownOpen = false;
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