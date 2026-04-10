import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AccountService } from 'src/app/auth/pages/account/services/account.service';

function readStoredPermissions(): string[] {
  try {
    const raw = localStorage.getItem('permissions');
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]).filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Rol administrator/super_admin o uno de allowedRoles o al menos un permiso de anyPermissions.
 */
export function validateRoleOrPermissionGuard(
  allowedRoles: string[],
  anyPermissions: string[],
  accountService: AccountService,
  router: Router
): Observable<boolean> {
  const token = localStorage.getItem('user_token');
  const storedRole = localStorage.getItem('role') || '';

  if (!token) {
    router.navigate(['/auth/iniciar-sesion'], { replaceUrl: true });
    return of(false);
  }

  const fullAdmin = storedRole === 'super_admin' || storedRole === 'administrator';
  const roleOk = allowedRoles.includes(storedRole);
  const permSet = new Set(readStoredPermissions());
  const permOk =
    anyPermissions.length > 0 && anyPermissions.some((p) => permSet.has(p));

  if (!fullAdmin && !roleOk && !permOk) {
    router.navigate(['/auth/iniciar-sesion'], { replaceUrl: true });
    return of(false);
  }

  return accountService.validateRole(storedRole).pipe(
    map(() => true),
    catchError((error) => {
      if (error.status === 401) {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('permissions');
        localStorage.removeItem('profile');
        if (!(window as any).__isRedirecting401) {
          router.navigate(['/auth/iniciar-sesion'], { replaceUrl: true });
        }
      }
      return of(false);
    })
  );
}

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
          localStorage.removeItem('permissions');
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





