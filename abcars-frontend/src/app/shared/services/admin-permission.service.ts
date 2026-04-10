import { Injectable } from '@angular/core';
import { OverviewPages } from '@interfaces/admin.interfaces';

const FULL_ADMIN_ROLES = ['super_admin', 'administrator'];

@Injectable({
  providedIn: 'root'
})
export class AdminPermissionService {
  /** Lista de nombres de permiso Spatie guardada en login. */
  getStoredPermissionNames(): string[] {
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

  isFullAdminRole(): boolean {
    const r = localStorage.getItem('role') || '';
    return FULL_ADMIN_ROLES.includes(r);
  }

  hasAnyPermission(names: string[]): boolean {
    if (!names.length) {
      return false;
    }
    const set = new Set(this.getStoredPermissionNames());
    return names.some((n) => set.has(n));
  }

  /**
   * Tarjeta del overview: sin required* → siempre visible.
   * Con restricciones → visible si es admin global, o cumple rol, o cumple algún permiso.
   */
  canShowOverviewPage(page: OverviewPages): boolean {
    if (this.isFullAdminRole()) {
      return true;
    }
    const rp = page.requiredPermissions;
    const rr = page.requiredRoles;
    if (!rp?.length && !rr?.length) {
      return true;
    }
    const role = localStorage.getItem('role') || '';
    if (rr?.length && rr.includes(role)) {
      return true;
    }
    if (rp?.length && this.hasAnyPermission(rp)) {
      return true;
    }
    return false;
  }
}
