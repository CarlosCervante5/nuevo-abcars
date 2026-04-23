/**
 * Sugerencias y coincidencia de marcas para autocompletado
 * (evita duplicados por error tipográfico al usar el catálogo existente).
 */

export function normalizeBrandKey(s: string | null | undefined): string {
  if (s == null || s === undefined) {
    return '';
  }
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

function levenshtein(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  const m = a.length;
  const n = b.length;
  if (m === 0) {
    return n;
  }
  if (n === 0) {
    return m;
  }
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) {
    dp[i]![0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0]![j] = j;
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost
      );
    }
  }
  return dp[m]![n]!;
}

export interface SuggestBrandsOptions {
  /** Máximo de sugerencias (p. ej. 15–20). @default 15 */
  limit?: number;
  /** Excluir una marca (al editar la misma fila). */
  excludeId?: number;
}

/**
 * Ordena marcas: coincide exacta (normalizada), empieza por, contiene, cercanía (Levenshtein).
 * útil con mat-autocomplete o datalist.
 */
export function suggestBrandsByName<T extends { name: string; id?: number }>(
  query: string,
  brands: T[],
  options: SuggestBrandsOptions = {}
): T[] {
  const { limit = 15, excludeId } = options;
  const q = normalizeBrandKey(query);
  const pool = brands.filter((b) => (excludeId == null ? true : b.id !== excludeId));
  if (!q) {
    return pool.slice(0, limit);
  }

  type Scored = { item: T; score: number };
  const out: Scored[] = pool.map((b) => {
    const n = normalizeBrandKey(b.name);
    if (n === q) {
      return { item: b, score: 0 };
    }
    if (n.startsWith(q)) {
      return { item: b, score: 1 + n.length * 0.01 };
    }
    if (n.includes(q)) {
      return { item: b, score: 2 + n.indexOf(q) * 0.01 };
    }
    const d = levenshtein(n, q);
    const maxL = Math.max(n.length, q.length, 1);
    if (d <= 1 && maxL <= 6) {
      return { item: b, score: 3 + d };
    }
    if (d <= 2 && maxL <= 20) {
      return { item: b, score: 5 + d * 0.1 };
    }
    if (d === 1 && maxL > 6) {
      return { item: b, score: 6 };
    }
    if (d <= Math.ceil(maxL * 0.25) && maxL >= 4 && d <= 4) {
      return { item: b, score: 7 + d };
    }
    return { item: b, score: 100 + d };
  });

  return out
    .filter((x) => x.score < 100)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((x) => x.item);
}

/**
 * Misma clave normalizada que una marca del catálogo.
 */
export function findExactBrandMatch<T extends { name: string; id?: number }>(
  typed: string,
  brands: T[],
  excludeId?: number
): T | null {
  const q = normalizeBrandKey(typed);
  if (!q) {
    return null;
  }
  for (const b of brands) {
    if (excludeId != null && b.id === excludeId) {
      continue;
    }
    if (normalizeBrandKey(b.name) === q) {
      return b;
    }
  }
  return null;
}

/**
 * Si el texto no coincide exacto pero se parece mucho a una marca existente (p. ej. toyyota → toyota).
 */
export function findFuzzySimilarBrand<T extends { name: string; id?: number }>(
  typed: string,
  brands: T[],
  options?: { excludeId?: number }
): T | null {
  const q = normalizeBrandKey(typed);
  if (q.length < 2) {
    return null;
  }
  const ex = options?.excludeId;
  const pool = brands.filter((b) => ex == null || b.id !== ex);

  let best: T | null = null;
  let bestD = 999;
  for (const b of pool) {
    const n = normalizeBrandKey(b.name);
    if (n === q) {
      continue;
    }
    const d = levenshtein(n, q);
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  if (best == null) {
    return null;
  }
  const n = normalizeBrandKey(best.name);
  const maxL = Math.max(n.length, q.length, 1);
  if (maxL <= 5) {
    return bestD <= 1 ? best : null;
  }
  if (maxL <= 12) {
    return bestD <= 2 ? best : null;
  }
  return bestD <= 2 && bestD / maxL < 0.2 ? best : null;
}
