import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const token = localStorage.getItem('user_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      return true;
    }
    
    // Si no está autenticado, redirigir al login
    this.router.navigate(['/auth/iniciar-sesion'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }
}












