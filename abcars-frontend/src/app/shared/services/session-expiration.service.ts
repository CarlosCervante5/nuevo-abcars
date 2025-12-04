import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';
import { Subscription, interval } from 'rxjs';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SessionExpirationService implements OnDestroy {
  // Tiempo de expiración en minutos (hardcodeado)
  // Cambiar a 480 para producción
  private readonly SESSION_EXPIRATION_MINUTES = 480;
  
  // Tiempo de advertencia antes de expirar (en minutos)
  private readonly WARNING_TIME_MINUTES = 5;
  
  // Intervalo de verificación (en milisegundos) - verificar cada minuto
  private readonly CHECK_INTERVAL = 60000; // 1 minuto
  
  private checkSubscription?: Subscription;
  private authSubscription?: Subscription;
  private warningShown = false;

  constructor(
    private authStateService: AuthStateService,
    private router: Router
  ) {
    this.startMonitoring();
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }

  /**
   * Inicia el monitoreo de expiración de sesión
   */
  private startMonitoring(): void {
    // Suscribirse a cambios en el estado de autenticación
    this.authSubscription = this.authStateService.authState$.subscribe(authState => {
      if (authState.isAuthenticated) {
        this.warningShown = false; // Resetear flag cuando se autentica
        this.startPeriodicCheck();
      } else {
        this.stopMonitoring();
      }
    });

    // Si ya está autenticado al iniciar el servicio, comenzar monitoreo
    if (this.authStateService.isAuthenticated()) {
      this.startPeriodicCheck();
    }
  }

  /**
   * Inicia la verificación periódica
   */
  private startPeriodicCheck(): void {
    // Detener verificación anterior si existe
    this.stopPeriodicCheck();

    // Verificar inmediatamente
    this.checkExpiration();

    // Verificar periódicamente
    this.checkSubscription = interval(this.CHECK_INTERVAL).subscribe(() => {
      this.checkExpiration();
    });
  }

  /**
   * Detiene la verificación periódica
   */
  private stopPeriodicCheck(): void {
    if (this.checkSubscription) {
      this.checkSubscription.unsubscribe();
      this.checkSubscription = undefined;
    }
  }

  /**
   * Detiene todo el monitoreo
   */
  private stopMonitoring(): void {
    this.stopPeriodicCheck();
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
      this.authSubscription = undefined;
    }
    this.warningShown = false;
  }

  /**
   * Verifica si la sesión está cerca de expirar o ya expiró
   */
  private checkExpiration(): void {
    if (!this.authStateService.isAuthenticated()) {
      return;
    }

    const sessionStartTime = this.authStateService.getSessionStartTime();
    if (!sessionStartTime) {
      return;
    }

    const now = Date.now();
    const sessionDuration = now - sessionStartTime;
    const expirationTime = this.SESSION_EXPIRATION_MINUTES * 60 * 1000; // Convertir a milisegundos
    const warningTime = this.WARNING_TIME_MINUTES * 60 * 1000; // Convertir a milisegundos
    const timeRemaining = expirationTime - sessionDuration;
    const timeUntilWarning = expirationTime - warningTime - sessionDuration;

    // Si ya expiró
    if (timeRemaining <= 0) {
      this.handleSessionExpired();
      return;
    }

    // Si está dentro del tiempo de advertencia y aún no se ha mostrado
    if (timeUntilWarning <= 0 && !this.warningShown) {
      this.showWarning(timeRemaining);
    }
  }

  /**
   * Muestra advertencia cuando la sesión está cerca de expirar
   */
  private showWarning(timeRemaining: number): void {
    this.warningShown = true;
    
    const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));
    
    Swal.fire({
      icon: 'warning',
      title: 'Tu sesión está por expirar',
      html: `Tu sesión expirará en <strong>${minutesRemaining} ${minutesRemaining === 1 ? 'minuto' : 'minutos'}</strong>.<br><br>Por favor, guarda tu trabajo y considera iniciar sesión nuevamente si es necesario.`,
      showConfirmButton: true,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#EEB838',
      allowOutsideClick: true,
      allowEscapeKey: true,
      timer: 10000 // Auto-cerrar después de 10 segundos
    });
  }

  /**
   * Maneja cuando la sesión ha expirado
   */
  private handleSessionExpired(): void {
    this.stopMonitoring();
    
    // Limpiar estado de autenticación
    this.authStateService.clearAuthState();
    
    // El interceptor HTTP ya manejará el 401 y mostrará el mensaje
    // Pero por si acaso, redirigir al login
    this.router.navigate(['/auth/iniciar-sesion']);
  }

  /**
   * Obtiene el tiempo restante de sesión en minutos
   */
  public getTimeRemaining(): number | null {
    if (!this.authStateService.isAuthenticated()) {
      return null;
    }

    const sessionStartTime = this.authStateService.getSessionStartTime();
    if (!sessionStartTime) {
      return null;
    }

    const now = Date.now();
    const sessionDuration = now - sessionStartTime;
    const expirationTime = this.SESSION_EXPIRATION_MINUTES * 60 * 1000;
    const timeRemaining = expirationTime - sessionDuration;

    if (timeRemaining <= 0) {
      return 0;
    }

    return Math.ceil(timeRemaining / (60 * 1000)); // Retornar en minutos
  }

  /**
   * Obtiene la fecha/hora de expiración
   */
  public getExpirationDate(): Date | null {
    const sessionStartTime = this.authStateService.getSessionStartTime();
    if (!sessionStartTime) {
      return null;
    }

    const expirationTime = sessionStartTime + (this.SESSION_EXPIRATION_MINUTES * 60 * 1000);
    return new Date(expirationTime);
  }
}

