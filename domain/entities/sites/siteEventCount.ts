/**
 * `analytics.eventCount` de un sitio: eventos PUBLICADOS vinculados a él que son próximos, están en curso o terminaron
 * hace menos de `EVENT_COUNT_WINDOW_DAYS`. Alimenta el ranking (siteEventCount × 4, ver siteRanking) y la etiqueta "Con eventos".
 * Excluye borradores, pendientes, rechazados y cancelados (solo cuenta `status === "published"`).
 */
export const EVENT_COUNT_WINDOW_DAYS = 90
const DAY_MS = 86_400_000

export interface CountableEvent {
  status?: string | null
  endDate?: Date | string | null
  startDate?: Date | string | null
}

const time = (d: Date | string | null | undefined) => {
  if (!d) return NaN
  const t = new Date(d).getTime()
  return t
}

export function countSiteEvents(events: CountableEvent[], now: Date = new Date()): number {
  const limit = now.getTime() - EVENT_COUNT_WINDOW_DAYS * DAY_MS
  return events.filter((e) => {
    if (e.status !== "published") return false
    const end = time(e.endDate)
    const ref = Number.isFinite(end) ? end : time(e.startDate)
    // sin ninguna fecha válida no se puede ubicar en el tiempo: se cuenta (el evento está publicado)
    return !Number.isFinite(ref) || ref >= limit
  }).length
}
