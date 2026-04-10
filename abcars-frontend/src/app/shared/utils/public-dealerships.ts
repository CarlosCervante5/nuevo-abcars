import { Dealership } from '../interfaces/admin.interfaces';

/** Orden fijo como en el home histórico (Matriz → … → Cholula). */
const PUBLIC_DEALERSHIP_SORT_ORDER: Record<string, number> = {
  'ventas matriz': 1,
  'ventas serdan': 2,
  'ventas sucursal tlaxcala': 3,
  'service body paint': 4,
  'ventas sucursal hidalgo': 5,
  'ventas sucursal cholula': 6,
};

export function sortDealershipsForPublic(list: Dealership[]): Dealership[] {
  return [...list].sort((a, b) => {
    const na = (a.name || '').toLowerCase().trim();
    const nb = (b.name || '').toLowerCase().trim();
    return (PUBLIC_DEALERSHIP_SORT_ORDER[na] ?? 99) - (PUBLIC_DEALERSHIP_SORT_ORDER[nb] ?? 99);
  });
}

/** Título público: campo description del seeder; si no, nombre en mayúsculas. */
export function branchPublicTitle(d: Dealership): string {
  const t = (d.description || '').trim();
  if (t) {
    return t;
  }
  return (d.name || '').toUpperCase();
}
