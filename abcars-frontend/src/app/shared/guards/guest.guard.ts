import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { getAdminDashboardUrl } from '../utils/admin-dashboard-url';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const token = localStorage.getItem('user_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      // Si ya está autenticado, redirigir según el rol
      // Usar replaceUrl para evitar acumular entradas en el historial
      const role = localStorage.getItem('role');
      if (role) {
        this.router.navigateByUrl(getAdminDashboardUrl(role), { replaceUrl: true });
      } else {
        // Si hay token pero no hay rol, limpiar y permitir acceso
        localStorage.removeItem('user_token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('profile');
        return true;
      }
      return false;
    }
    
    return true;
  }
}














