/**
 * `analytics.eventCount` de un sitio: eventos PUBLICADOS vinculados a él que son próximos, están en curso o
 * terminaron hace menos de `SITE_EVENT_TAIL_DAYS` días. Alimenta el ranking (ver siteRanking, con tope) y la
 * etiqueta "Con eventos". Excluye borradores, pendientes, rechazados y cancelados (solo cuenta `status === "published"`).
 *
 * Con el tiempo el conteo solo BAJA (un evento termina y sale de la ventana), y sabemos exactamente cuándo:
 * `validUntil` es el primer instante en que deja de ser verdad. Se guarda junto al conteo
 * (`analytics.eventCountValidUntil`) para poder revalidarlo sin recalcular todo.
 */
export const SITE_EVENT_TAIL_DAYS = 7
const DAY_MS = 86_400_000
const TAIL_MS = SITE_EVENT_TAIL_DAYS * DAY_MS

export interface CountableEvent {
  status?: string | null
  endDate?: Date | string | null
  startDate?: Date | string | null
}

export interface SiteEventState {
  count: number
  /** Primer instante en que el conteo deja de ser verdad (fin del evento contado + cola). `null` = no vence solo. */
  validUntil: Date | null
}

const time = (d: Date | string | null | undefined) => {
  if (!d) return NaN
  return new Date(d).getTime()
}

/**
 * Cuenta y vencimiento. Un evento cuenta mientras `fin + cola > ahora` (`fin` = endDate, o startDate si falta).
 * Sin ninguna fecha válida no se puede ubicar en el tiempo: se cuenta y no aporta vencimiento.
 */
export function siteEventState(events: CountableEvent[], now: Date = new Date()): SiteEventState {
  let count = 0
  let firstExpiry = Infinity
  for (const e of events) {
    if (e.status !== "published") continue
    const end = time(e.endDate)
    const ref = Number.isFinite(end) ? end : time(e.startDate)
    if (!Number.isFinite(ref)) {
      count++
      continue
    }
    const expiry = ref + TAIL_MS
    if (expiry <= now.getTime()) continue
    count++
    if (expiry < firstExpiry) firstExpiry = expiry
  }
  return { count, validUntil: Number.isFinite(firstExpiry) ? new Date(firstExpiry) : null }
}

export function countSiteEvents(events: CountableEvent[], now: Date = new Date()): number {
  return siteEventState(events, now).count
}

/** ¿Ya pasó el vencimiento guardado? Sin vencimiento (null/ausente/inválido) nunca vence solo. */
export function isEventCountExpired(validUntil: Date | string | number | null | undefined, now: Date = new Date()): boolean {
  const t = validUntil == null ? NaN : new Date(validUntil).getTime()
  return Number.isFinite(t) && t <= now.getTime()
}
