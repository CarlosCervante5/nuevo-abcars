/**
 * Nombres técnicos Spatie → texto legible en el panel (usuarios, roles y permisos).
 * El slug sigue siendo el valor enviado al API; esto es solo presentación.
 */
const ROLE_LABELS_ES: Record<string, string> = {
  body: 'Body / HyP (órdenes independientes)',
  bodywork_paint_technician: 'Técnico HyP (en valuación)',
  spare_parts: 'Refacciones',
  valuator: 'Valuador',
  technician: 'Técnico',
  appointment_manager: 'Gestor de citas externas',
  valuation_manager: 'Gerente de valuación',
  marketing: 'Marketing (inventario web)',
  gestor: 'Gestor de marketing',
  administrator: 'Administrador',
  super_admin: 'Super administrador',
  manager: 'Manager de inventario',
  client: 'Cliente',
  staff: 'Staff',
  receptionist: 'Recepción',
  seller: 'Vendedor / referidos',
  blog_manager: 'Gestor de blog',
  'strega-seller': 'Strega — vendedor',
  'strega-manager': 'Strega — manager',
  'strega-administrator': 'Strega — administrador',
};

export function displayAdminRoleNameEs(technical: string | null | undefined): string {
  if (technical == null || technical === '') {
    return '—';
  }
  return ROLE_LABELS_ES[technical] ?? technical;
}
