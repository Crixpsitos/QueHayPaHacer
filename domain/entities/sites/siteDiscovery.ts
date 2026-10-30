/**
 * Elige hasta `limit` ids al azar de `ids`, sin los de `excludeIds` (los que ya salen en "Sitios populares").
 * Fisher-Yates: el `sort(() => Math.random() - 0.5)` anterior no reparte parejo.
 */
export function pickDiscoverIds(
  ids: readonly string[],
  limit: number,
  excludeIds: readonly string[] = [],
  random: () => number = Math.random,
): string[] {
  const skip = new Set(excludeIds)
  const pool = ids.filter((id) => !skip.has(id))
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, limit)
}
