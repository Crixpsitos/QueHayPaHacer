import { pickDiscoverIds } from "@/domain/entities/sites/siteDiscovery"

/** Generador con semilla (mulberry32): mismo texto → misma secuencia. */
function seeded(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19) }
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Selección del bloque "Actividades de hoy": hasta `limit`, con máximo `maxPerHost` por anfitrión.
 * Determinista por día (+ `seed`): dos cargas el mismo día dan el mismo conjunto; no depende del orden de entrada.
 */
export function dailyActivityPicks(
  items: readonly { id: string; host: string }[],
  day: string,
  { limit = 8, maxPerHost = 2, seed = "" }: { limit?: number; maxPerHost?: number; seed?: string } = {},
): string[] {
  const hostOf = new Map(items.map((i) => [i.id, i.host]))
  const ids = [...hostOf.keys()].sort() // el orden de entrada no cuenta
  const shuffled = pickDiscoverIds(ids, ids.length, [], seeded(`${day}|${seed}`))
  const per = new Map<string, number>()
  const out: string[] = []
  for (const id of shuffled) {
    const h = hostOf.get(id)!
    if ((per.get(h) ?? 0) >= maxPerHost) continue
    per.set(h, (per.get(h) ?? 0) + 1)
    out.push(id)
    if (out.length >= limit) break
  }
  return out
}
