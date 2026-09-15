const VALUATION_READ_ONLY_ROLES = ['administrator', 'super_admin'];

/** Admin en panel Valuaciones: consulta como valuador asignado, sin editar. */
export function isValuationReadOnlyViewer(): boolean {
  const role = localStorage.getItem('role') || '';
  return VALUATION_READ_ONLY_ROLES.includes(role);
}

export function valuationAppointmentsListLink(): string[] {
  if (isValuationReadOnlyViewer()) {
    return ['/admin/administrator/valuation-appointments'];
  }
  const role = localStorage.getItem('role') || '';
  const base = role === 'seller' ? '/admin/seller' : '/admin/valuator';
  return [base, 'appointment'];
}
