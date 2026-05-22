/** Etiqueta en español para `vehicles.category` (valores del ENUM en BD). */
const VEHICLE_CATEGORY_LABELS: Record<string, string> = {
  new: 'Nuevo',
  pre_owned: 'Seminuevo',
  demo: 'Demo',
  consignment: 'Consignación',
};

export function formatVehicleCategoryLabel(category: string | null | undefined): string {
  if (!category || !String(category).trim()) {
    return '';
  }
  const key = String(category).trim().toLowerCase();
  return VEHICLE_CATEGORY_LABELS[key] ?? category;
}
