import { Dealership, DealershipServiceType } from '../interfaces/admin.interfaces';

/** Orden fijo como en el home histórico (Matriz → … → Cholula). */
const PUBLIC_DEALERSHIP_SORT_ORDER: Record<string, number> = {
  'ventas matriz': 1,
  'ventas serdan': 2,
  'ventas sucursal tlaxcala': 3,
  'service body paint': 4,
  'ventas sucursal hidalgo': 5,
  'ventas sucursal cholula': 6,
};

/**
 * Evita filas repetidas si la API devuelve el mismo id o el mismo nombre+dirección dos veces.
 */
export function dedupeDealershipsList(list: Dealership[]): Dealership[] {
  const byKey = new Map<string, Dealership>();
  for (const d of list) {
    const id = d.id;
    const key =
      id != null && !Number.isNaN(Number(id))
        ? `id:${id}`
        : `n:${(d.name || '').toLowerCase().trim()}|a:${(d.address || '').toLowerCase().trim()}`;
    if (!byKey.has(key)) {
      byKey.set(key, d);
    }
  }
  return [...byKey.values()];
}

/**
 * Para selects: tras deduplicar por id/dirección, una sola entrada por texto visible (nombre + ciudad).
 * Evita dos opciones idénticas cuando hay filas duplicadas en BD con ids distintos.
 */
export function dedupeDealershipsForSelect(list: Dealership[]): Dealership[] {
  const step1 = dedupeDealershipsList(list);
  const byLabel = new Map<string, Dealership>();
  for (const d of step1) {
    const label = `${(d.name || '').toLowerCase().trim()}|${(d.location || '').toLowerCase().trim()}`;
    if (!byLabel.has(label)) {
      byLabel.set(label, d);
    }
  }
  return [...byLabel.values()];
}

export function sortDealershipsForPublic(list: Dealership[]): Dealership[] {
  const unique = dedupeDealershipsList(list);
  return [...unique].sort((a, b) => {
    const na = (a.name || '').toLowerCase().trim();
    const nb = (b.name || '').toLowerCase().trim();
    return (PUBLIC_DEALERSHIP_SORT_ORDER[na] ?? 99) - (PUBLIC_DEALERSHIP_SORT_ORDER[nb] ?? 99);
  });
}

/** Etiqueta en español para el tipo de sucursal (venta / servicios). */
export function dealershipServiceTypeLabel(
  t: DealershipServiceType | string | undefined | null,
): string {
  if (t === 'servicios') {
    return 'Servicios';
  }
  return 'Venta';
}

/** Título público: campo description del seeder; si no, nombre en mayúsculas. */
export function branchPublicTitle(d: Dealership): string {
  const t = (d.description || '').trim();
  if (t) {
    return t;
  }
  return (d.name || '').toUpperCase();
}
