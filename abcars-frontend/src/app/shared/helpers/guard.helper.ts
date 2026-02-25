import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AccountService } from 'src/app/auth/pages/account/services/account.service';

/**
 * Helper function to validate role in guards
 * Prevents infinite loops by checking token and role before making HTTP request
 * @param role - string o array de roles permitidos (ej: 'valuator' o ['valuator', 'seller'])
 */
export function validateRoleGuard(
  role: string | string[],
  accountService: AccountService,
  router: Router
): Observable<boolean> {
  const allowedRoles = Array.isArray(role) ? role : [role];

  // Verificar si hay token antes de hacer la petición
  const token = localStorage.getItem('user_token');
  const storedRole = localStorage.getItem('role');
  
  if (!token) {
    // Si no hay token, redirigir inmediatamente sin hacer petición
    router.navigate(['/auth/iniciar-sesion'], { replaceUrl: true });
    return of(false);
  }

  // Si el rol no está en la lista permitida, redirigir inmediatamente
  if (!allowedRoles.includes(storedRole || '')) {
    router.navigate(['/auth/iniciar-sesion'], { replaceUrl: true });
    return of(false);
  }
  
  // Si hay token y el rol coincide, validar con el backend (usar el rol almacenado)
  return accountService.validateRole(storedRole!)
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





