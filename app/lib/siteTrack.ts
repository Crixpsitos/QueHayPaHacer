import type { SiteTrackType } from "@/domain/entities/sites/siteStats"

/** Envía una vista o clic de la ficha de un sitio sin bloquear la navegación (sendBeacon; fetch keepalive de respaldo). */
export function trackSite(siteId: string, type: SiteTrackType) {
  const url = `/api/sites/${encodeURIComponent(siteId)}/track`
  const body = JSON.stringify({ type })
  try {
    if (navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) return
    void fetch(url, { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } })
  } catch {}
}

/** Una vista por sitio y sesión del navegador. Devuelve true la primera vez; sessionStorage bloqueado = cuenta siempre. */
export function firstViewOfSession(siteId: string, storage?: Pick<Storage, "getItem" | "setItem">): boolean {
  try {
    const s = storage ?? sessionStorage
    const key = `qhpa:site-view:${siteId}`
    if (s.getItem(key)) return false
    s.setItem(key, "1")
  } catch {}
  return true
}
