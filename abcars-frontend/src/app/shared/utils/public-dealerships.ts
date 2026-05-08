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

const SERVICE_TYPES_ORDER: DealershipServiceType[] = [
  'venta',
  'valuaciones',
  'servicios',
];

const ALLOWED_SERVICE_TYPES = new Set<DealershipServiceType>(SERVICE_TYPES_ORDER);

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

/** Etiqueta en español para un tipo de sucursal. */
export function dealershipServiceTypeLabel(
  t: DealershipServiceType | string | undefined | null,
): string {
  switch (t) {
    case 'servicios':
      return 'Servicios';
    case 'valuaciones':
      return 'Valuaciones';
    case 'venta':
    default:
      return 'Venta';
  }
}

/**
 * Lista normalizada y ordenada de tipos a partir de la respuesta API.
 */
export function normalizeDealershipServiceTypesList(
  types: unknown,
  legacy?: string | null,
): DealershipServiceType[] {
  const out: DealershipServiceType[] = [];
  const push = (x: string) => {
    const t = x.toLowerCase().trim() as DealershipServiceType;
    if (ALLOWED_SERVICE_TYPES.has(t) && !out.includes(t)) {
      out.push(t);
    }
  };
  if (Array.isArray(types)) {
    for (const x of types) {
      if (typeof x === 'string') {
        push(x);
      }
    }
  }
  if (out.length === 0 && legacy && typeof legacy === 'string') {
    push(legacy);
  }
  if (out.length === 0) {
    out.push('venta');
  }
  const idx = (t: DealershipServiceType) => SERVICE_TYPES_ORDER.indexOf(t);
  return [...out].sort((a, b) => idx(a) - idx(b));
}

/** Tipos de una sucursal (para chips, selects, etc.). */
export function dealershipTypesForDisplay(d: Dealership): DealershipServiceType[] {
  return normalizeDealershipServiceTypesList(d.service_types, d.service_type ?? null);
}

/**
 * Sucursales que ofrecen al menos uno de los tipos indicados (OR).
 * Útil para mostrar solo sucursales de venta en financiamiento, solo valuaciones en citas de valuación, etc.
 */
export function filterDealershipsByServiceTypes(
  list: Dealership[],
  required: DealershipServiceType | DealershipServiceType[],
): Dealership[] {
  const needs = (Array.isArray(required) ? required : [required]) as DealershipServiceType[];
  const base = dedupeDealershipsList(list);
  return base.filter((d) => {
    const types = dealershipTypesForDisplay(d);
    return needs.some((n) => types.includes(n));
  });
}

/** Texto corto "Venta · Valuaciones" para listados. */
export function dealershipServiceTypesSummary(d: Dealership): string {
  return dealershipTypesForDisplay(d)
    .map(dealershipServiceTypeLabel)
    .join(' · ');
}

/** Título público: campo description del seeder; si no, nombre en mayúsculas. */
export function branchPublicTitle(d: Dealership): string {
  const t = (d.description || '').trim();
  if (t) {
    return t;
  }
  return (d.name || '').toUpperCase();
}
