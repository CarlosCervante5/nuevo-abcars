/**
 * Resuelve la URL del dashboard según el rol Spatie.
 * Debe coincidir con la redirección post-login en login.component.ts
 * y con las rutas reales bajo /admin/*.
 */
export function getAdminDashboardUrl(role: string | null | undefined): string {
  if (!role) {
    return '/auth/mi-cuenta';
  }

  if (role === 'client') {
    return '/auth/mi-cuenta';
  }

  const carwashRoles = [
    'carwash_admin',
    'carwash_supervisor',
    'carwash_cashier',
    'carwash_washer',
    'carwash_agent'
  ];

  if (carwashRoles.includes(role)) {
    return '/admin/administrator/carwash/board';
  }

  if (role === 'super_admin') {
    return '/admin/administrator';
  }

  // Rol Spatie "manager" (inventario); no hay /admin/manager
  if (role === 'manager') {
    return '/admin/marketing';
  }

  const validAdminRoles = [
    'administrator',
    'marketing',
    'blog_manager',
    'gestor',
    'receptionist',
    'valuator',
    'technician',
    'appointment_manager',
    'bodywork_paint_technician',
    'body',
    'spare_parts',
    'valuation_manager',
    'seller'
  ];

  if (validAdminRoles.includes(role)) {
    return `/admin/${role}`;
  }

  // Fallback seguro: cuenta cliente / login
  return '/auth/mi-cuenta';
}
