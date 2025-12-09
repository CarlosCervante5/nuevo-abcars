import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AccountService } from 'src/app/auth/pages/account/services/account.service';

/**
 * Helper function to validate role in guards
 * Prevents infinite loops by checking token and role before making HTTP request
 */
export function validateRoleGuard(
  role: string,
  accountService: AccountService,
  router: Router
): Observable<boolean> {
  // Verificar si hay token antes de hacer la petición
  const token = localStorage.getItem('user_token');
  const storedRole = localStorage.getItem('role');
  
  if (!token) {
    // Si no hay token, redirigir inmediatamente sin hacer petición
    router.navigate(['/auth/iniciar-sesion'], { replaceUrl: true });
    return of(false);
  }

  // Si el rol no coincide, redirigir inmediatamente
  if (storedRole !== role) {
    router.navigate(['/auth/iniciar-sesion'], { replaceUrl: true });
    return of(false);
  }
  
  // Si hay token y el rol coincide, validar con el backend
  return accountService.validateRole(role)
    .pipe(
      map(() => true),
      catchError((error) => {
        // Si hay error 401, el interceptor ya manejará la redirección
        // Solo necesitamos retornar false y limpiar el estado
        if (error.status === 401) {
          // Limpiar el estado de autenticación
          localStorage.removeItem('user_token');
          localStorage.removeItem('user');
          localStorage.removeItem('role');
          localStorage.removeItem('profile');
          // El interceptor ya redirigirá, pero por si acaso:
          if (!(window as any).__isRedirecting401) {
            router.navigate(['/auth/iniciar-sesion'], { replaceUrl: true });
          }
        }
        return of(false);
      })
    );
}





