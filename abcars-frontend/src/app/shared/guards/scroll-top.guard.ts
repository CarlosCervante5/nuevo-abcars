import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ScrollService } from '../services/scroll.service';

@Injectable({
  providedIn: 'root'
})
export class ScrollTopGuard implements CanActivate {

  constructor(private scrollService: ScrollService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Hacer scroll to top en cada navegación
    setTimeout(() => {
      this.scrollService.scrollToTop();
    }, 50);
    
    return true;
  }
} 