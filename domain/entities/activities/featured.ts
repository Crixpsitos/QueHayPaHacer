import { dailyActivityPicks } from "./dailyPicks"

export interface FeaturedCandidate { id: string; host: string; hasPhoto: boolean; /** salida más próxima (ms) o null si no tiene fecha fija */ nextAt: number | null }

const WEEK = 7 * 86_400_000

/**
 * «El plan de la semana» del hub: una sola actividad, la misma todo el día. Primero las que salen en los próximos 7 días y
 * tienen foto; si no hay, las que salen esta semana; si no, cualquiera con foto; si no, cualquiera. Entre las elegibles se
 * escoge por día (así rota cada día sin que dependa del orden de la lista). null si no hay actividades.
 */
export function pickFeatured(items: readonly FeaturedCandidate[], now: Date, day: string): string | null {
  if (!items.length) return null
  const soon = (c: FeaturedCandidate) => c.nextAt !== null && c.nextAt >= now.getTime() && c.nextAt - now.getTime() <= WEEK
  const tiers = [
    items.filter((c) => c.hasPhoto && soon(c)),
    items.filter(soon),
    items.filter((c) => c.hasPhoto),
    [...items],
  ]
  const pool = tiers.find((t) => t.length)!
  return dailyActivityPicks(pool, day, { limit: 1, maxPerHost: 1, seed: "hub" })[0] ?? null
}
