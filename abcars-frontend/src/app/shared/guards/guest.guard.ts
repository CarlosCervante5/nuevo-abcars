import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

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
      const role = localStorage.getItem('role');
      if (role === 'client') {
        this.router.navigate(['/auth/mi-cuenta']);
      } else {
        this.router.navigate([`/admin/${role}`]);
      }
      return false;
    }
    
    return true;
  }
}














