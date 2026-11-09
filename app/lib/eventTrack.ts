import type { EventTrackType } from "@/domain/entities/analytics/trackTypes"
import { SOURCES, trafficSource, type TrafficSource } from "@/domain/entities/analytics/trafficSource"

type Store = Pick<Storage, "getItem" | "setItem">

/** Envía una vista o acción de un evento sin bloquear la navegación (sendBeacon; fetch keepalive de respaldo). */
export function trackEvent(eventId: string, type: EventTrackType, src?: TrafficSource) {
  const url = `/api/events/${encodeURIComponent(eventId)}/track`
  const body = JSON.stringify(src && src !== "direct" ? { type, src } : { type })
  try {
    if (navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) return
    void fetch(url, { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } })
  } catch {}
}

/** Acción de la ficha (clic en el mapa, compartir, registro externo) con el origen de esta visita. Solo en el navegador. */
export function trackEventAction(eventId: string, type: Exclude<EventTrackType, "view">) {
  trackEvent(eventId, type, landingSource({ href: window.location.href, referrer: document.referrer }))
}

/** Una vista por evento y día, también si se recarga o se cierra la pestaña. Almacenamiento bloqueado = cuenta (el tope del servidor acota). */
export function firstEventViewOfDay(eventId: string, day: string, storage?: Store): boolean {
  try {
    const s = storage ?? localStorage
    const key = `qhpa:event-view-day:${eventId}`
    if (s.getItem(key) === day) return false
    s.setItem(key, day)
  } catch {}
  return true
}

const LANDING_KEY = "qhpa:landing-src"

/**
 * Origen de la sesión del navegador: se calcula UNA vez al aterrizar (UTM, `qr` o referrer) y se recuerda en
 * sessionStorage; al navegar dentro del sitio ya no hay UTM y el referrer es propio, así que se reutiliza.
 */
export function landingSource(
  page: { href: string; referrer: string },
  storage?: Store,
): TrafficSource {
  try {
    const s = storage ?? sessionStorage
    const saved = s.getItem(LANDING_KEY)
    if (saved && (SOURCES.includes(saved as never) || /^link:[A-Za-z0-9]{7}$/.test(saved) || /^ch:(ig|ig_h|wa|fb|x|tt|qr)$/.test(saved))) return saved as TrafficSource
    const url = new URL(page.href)
    const src = trafficSource({ utm_source: url.searchParams.get("utm_source") ?? undefined, qr: url.searchParams.get("qr") ?? undefined, ch: url.searchParams.get("ch") ?? undefined, ref: page.referrer })
    s.setItem(LANDING_KEY, src)
    return src
  } catch {
    return "direct"
  }
}
