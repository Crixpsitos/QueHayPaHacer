import { haversineKm, isUsableCoordinates, type LatLng } from "@/domain/entities/sites/directions"

/** Filas por tarjeta de «Más para hacer»: las tres tarjetas miden lo mismo (ver prototipo). */
export const ROWS_PER_LEVEL = 3
/** «Cerca» = a menos de 1 km. */
export const NEAR_METERS = 1000

export interface MoreItem {
  id: string
  siteId: string | null
  hostId: string
  category: string
  geo: LatLng | null
}

export type LevelKey = "here" | "group" | "near" | "similar" | "city"
export interface MoreLevel { key: LevelKey; total: number; items: { id: string; meters: number | null }[] }

const meters = (a: LatLng | null, b: LatLng | null): number | null =>
  isUsableCoordinates(a) && isUsableCoordinates(b) ? Math.round(haversineKm(a, b) * 1000) : null

/**
 * Agrupa lo que sigue después de una actividad en hasta tres niveles, de lo más cercano a lo más amplio:
 * (sitio → «Aquí mismo», si no «Del mismo grupo») → (con punto → «Cerca», si no «Parecidas») → «Hoy en Ibagué».
 * Cada actividad sale una vez; lo que no cabe en una tarjeta baja al nivel siguiente.
 */
export function moreToDo(current: MoreItem, pool: MoreItem[]): MoreLevel[] {
  const hasPoint = isUsableCoordinates(current.geo)
  let rest = pool.filter((p) => p.id !== current.id)
  const dist = (p: MoreItem) => meters(current.geo, p.geo)
  const byDistance = (a: MoreItem, b: MoreItem) => (dist(a) ?? Infinity) - (dist(b) ?? Infinity)

  const levels: { key: LevelKey; pick: (p: MoreItem) => boolean; sort: boolean }[] = [
    current.siteId
      ? { key: "here", pick: (p) => p.siteId === current.siteId, sort: false }
      : { key: "group", pick: (p) => p.hostId === current.hostId, sort: false },
    hasPoint
      ? { key: "near", pick: (p) => (dist(p) ?? Infinity) <= NEAR_METERS, sort: true }
      : { key: "similar", pick: (p) => p.category === current.category, sort: false },
    { key: "city", pick: () => true, sort: hasPoint },
  ]

  const out: MoreLevel[] = []
  for (const l of levels) {
    const candidates = rest.filter(l.pick)
    if (!candidates.length) continue
    if (l.sort) candidates.sort(byDistance)
    const shown = candidates.slice(0, ROWS_PER_LEVEL)
    const taken = new Set(shown.map((s) => s.id))
    rest = rest.filter((p) => !taken.has(p.id))
    out.push({ key: l.key, total: candidates.length, items: shown.map((s) => ({ id: s.id, meters: dist(s) })) })
  }
  return out
}
