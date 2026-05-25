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
