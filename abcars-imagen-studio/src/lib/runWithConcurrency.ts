/**
 * Ejecuta tareas con como máximo `limit` promesas en vuelo (cola en paralelo acotado).
 */
export async function runWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return
  const n = Math.max(1, Math.floor(limit))
  let nextIndex = 0

  const worker = async (): Promise<void> => {
    while (true) {
      const i = nextIndex++
      if (i >= items.length) return
      await fn(items[i], i)
    }
  }

  const workers = Math.min(n, items.length)
  await Promise.all(Array.from({ length: workers }, () => worker()))
}
