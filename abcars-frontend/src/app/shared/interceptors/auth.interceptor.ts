import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import Swal from 'sweetalert2';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isHandling401 = false; // Flag para evitar loops infinitos y múltiples mensajes
  private last401Time = 0; // Timestamp del último 401 manejado
  private readonly COOLDOWN_PERIOD = 5000; // 5 segundos de cooldown entre mensajes

  constructor(
    private router: Router,
    private authStateService: AuthStateService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    // Excluir endpoints que no deben ser interceptados (como login, register, etc.)
    const excludedEndpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/recover_account',
      '/api/auth/reset_password'
    ];

    const isExcluded = excludedEndpoints.some(endpoint => req.url.includes(endpoint));

    // Si el endpoint está excluido, no interceptar
    if (isExcluded) {
      return next.handle(req);
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Solo manejar errores 401
        if (error.status === 401) {
          const now = Date.now();
          const timeSinceLast401 = now - this.last401Time;

          // Solo procesar si no estamos ya manejando un 401 y ha pasado el cooldown
          if (!this.isHandling401 && timeSinceLast401 > this.COOLDOWN_PERIOD) {
            this.isHandling401 = true;
            this.last401Time = now;

            // Limpiar el estado de autenticación
            this.authStateService.clearAuthState();

            // Verificar si ya estamos en la página de login para evitar redirecciones innecesarias
            const currentUrl = this.router.url;
            const isOnLoginPage = currentUrl.includes('/auth/iniciar-sesion');

            if (!isOnLoginPage) {
              // Mostrar mensaje al usuario solo si no estamos en la página de login
              Swal.fire({
                icon: 'warning',
                title: 'Sesión expirada',
                text: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
                showConfirmButton: true,
                confirmButtonColor: '#EEB838',
                timer: 5000,
                allowOutsideClick: false,
                allowEscapeKey: false
              }).then(() => {
                // Redirigir al login
                this.router.navigate(['/auth/iniciar-sesion']).then(() => {
                  this.isHandling401 = false;
                });
              });
            } else {
              // Si ya estamos en login, solo limpiar el estado sin mostrar mensaje
              this.isHandling401 = false;
            }
          }
        }

        // Re-lanzar el error para que otros manejadores puedan procesarlo si es necesario
        return throwError(() => error);
      })
    );
  }
}

export const authInterceptorProvider = {
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptor,
  multi: true
};

