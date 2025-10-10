import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {

  constructor() { }

  // Método para hacer scroll to top
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Método para hacer scroll to top inmediato (sin animación)
  scrollToTopInstant(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  // Método para hacer scroll a una posición específica
  scrollToPosition(position: number): void {
    window.scrollTo({ top: position, behavior: 'smooth' });
  }
} 