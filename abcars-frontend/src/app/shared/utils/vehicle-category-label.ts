/** Etiqueta en español para `vehicles.category` (valores del ENUM en BD). */
const VEHICLE_CATEGORY_LABELS: Record<string, string> = {
  new: 'Nuevo',
  pre_owned: 'Seminuevo',
  demo: 'Demo',
  consignment: 'Consignación',
};

/** Badge del catálogo (mayúsculas, con tilde donde aplica). */
const VEHICLE_CATEGORY_BADGE_LABELS: Record<string, string> = {
  new: 'NUEVO',
  pre_owned: 'SEMINUEVO',
  demo: 'DEMO',
  consignment: 'CONSIGNACIÓN',
};

export function formatVehicleCategoryLabel(category: string | null | undefined): string {
  if (!category || !String(category).trim()) {
    return '';
  }
  const key = String(category).trim().toLowerCase();
  return VEHICLE_CATEGORY_LABELS[key] ?? category;
}

export function formatVehicleCategoryBadgeLabel(category: string | null | undefined): string {
  if (!category || !String(category).trim()) {
    return '';
  }
  const key = String(category).trim().toLowerCase();
  return VEHICLE_CATEGORY_BADGE_LABELS[key] ?? String(category).trim().toUpperCase();
}

/** Badge principal en tarjeta: Nuevo/Seminuevo/Demo (no reemplaza por Consignación). */
export function getPrimaryVehicleCategoryBadgeLabel(
  category: string | null | undefined,
  isConsignment?: boolean | null,
): string {
  const key = String(category ?? '').trim().toLowerCase();
  if (isConsignment && key === 'consignment') {
    return VEHICLE_CATEGORY_BADGE_LABELS['pre_owned'];
  }
  return formatVehicleCategoryBadgeLabel(category) || 'N/A';
}

export function shouldShowConsignmentBadge(
  category: string | null | undefined,
  isConsignment?: boolean | null,
): boolean {
  if (isConsignment === true) {
    return true;
  }
  return String(category ?? '').trim().toLowerCase() === 'consignment';
}

/** Etiqueta para detalle / paréntesis en tipo de vehículo. */
export function getVehicleDetailCategoryLabel(
  category: string | null | undefined,
  isConsignment?: boolean | null,
): string {
  if (shouldShowConsignmentBadge(category, isConsignment)) {
    return 'Consignación';
  }
  return formatVehicleCategoryLabel(category);
}

/** Ubicación en tarjeta: Consignación solo para unidades marcadas. */
export function getVehicleCardLocationLabel(
  dealershipLocation: string | null | undefined,
  category: string | null | undefined,
  isConsignment?: boolean | null,
): string {
  if (shouldShowConsignmentBadge(category, isConsignment)) {
    return 'Consignación';
  }
  return String(dealershipLocation ?? '').trim();
}
