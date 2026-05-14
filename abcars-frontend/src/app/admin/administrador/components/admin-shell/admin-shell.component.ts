import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { AdminPermissionService } from '@services/admin-permission.service';
import { ADMINISTRATOR_NAV_ITEMS, AdministratorNavItem } from '../../config/administrator-nav.config';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-shell',
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.css'],
  standalone: false
})
export class AdminShellComponent implements OnInit, OnDestroy {
  sidebarOpen = false;
  pageTitle = 'Panel';
  rawRole = '';
  userName = '';
  userEmail = '';
  avatarUrl = 'assets/icons/profile.svg';

  private sub?: Subscription;

  private readonly titleBySegment: Record<string, string> = {
    '': 'Inicio',
    vehicles: 'Inventario',
    intelimotor: 'Intelimotor',
    'studio-catalog': 'Ciclorama catálogo',
    'home-banner': 'Banner del inicio',
    'assing-valuations': 'Solicitudes',
    'valuation-appointments': 'Valuaciones',
    'delivery-photos': 'Fotos de entregas',
    promotions: 'Promociones',
    users: 'Usuarios',
    permissions: 'Roles y permisos',
    dealerships: 'Sucursales',
    'brands-models': 'Marcas y modelos',
    analytics: 'Analytics',
    assistant: 'Asistente de datos',
    'api-info': 'Información de la API',
    documentation: 'Documentación'
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private adminPermission: AdminPermissionService
  ) {}

  ngOnInit(): void {
    this.rawRole = localStorage.getItem('role') || '';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const profile = JSON.parse(localStorage.getItem('profile') || 'null');
    this.userName = profile?.name ? `${profile.name} ${profile.last_name || ''}`.trim() : user.nickname || 'Usuario';
    this.userEmail = user.email || '';
    this.avatarUrl = profile?.picture || 'assets/icons/profile.svg';

    this.updateTitle(this.router.url);
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.updateTitle(e.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get visibleNav(): AdministratorNavItem[] {
    return ADMINISTRATOR_NAV_ITEMS.filter((item) => this.adminPermission.canShowOverviewPage(item));
  }

  isInicioItem(item: AdministratorNavItem): boolean {
    return item.title === 'Inicio';
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebarMobile(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      this.sidebarOpen = false;
    }
  }

  private updateTitle(url: string): void {
    const path = url.split('?')[0].replace(/\/$/, '');
    const base = '/admin/administrator';
    if (path === base) {
      this.pageTitle = 'Inicio';
      return;
    }
    const rel = path.startsWith(base + '/') ? path.slice(base.length + 1) : '';
    const seg = rel.split('/')[0] || '';
    this.pageTitle = this.titleBySegment[seg] || 'Panel';
  }

  logout(): void {
    Swal.fire({
      title: '¿Cerrar sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ca8a04'
    }).then((r) => {
      if (!r.isConfirmed) {
        return;
      }
      this.authService.logout().subscribe({
        next: () => {},
        error: () => {}
      });
      this.authService.clearAuthState();
      localStorage.removeItem('profile');
      void this.router.navigate(['/']);
    });
  }
}
