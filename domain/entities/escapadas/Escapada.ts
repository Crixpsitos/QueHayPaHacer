/**
 * «Escapadita»: un pueblo cercano con planes (eventos) para ir y volver el mismo día. Lo carga el administrador (colección `escapadas`):
 * `{ name, slug, minutesAway, coverUrl, eventIds, isActive, order }`. Cuántos planes tiene y cuál sigue salen de los eventos vinculados.
 */
export interface Escapada {
  id: string
  name: string
  slug: string
  minutesAway: number
  coverUrl: string | null
  eventIds: string[]
  order: number
}

/** 40 → «A 40 min», 60 → «A 1 h», 90 → «A 1 h 30». */
export function farLabel(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  if (m < 60) return `A ${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `A ${h} h ${rest}` : `A ${h} h`
}
