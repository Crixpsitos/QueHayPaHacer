"use client"

import { useEffect, type ReactNode } from "react"
import { firstViewOfSession, trackSite } from "@/app/lib/siteTrack"
import { isSiteTrackType } from "@/domain/entities/sites/siteStats"
import { analytics } from "@/app/lib/analytics"
import { siteClickEvent } from "@/app/lib/analytics/events"

/**
 * Mide la ficha pública: una vista por sitio y sesión (cuando la pestaña está activa) y clics en los elementos con
 * `data-site-track="<tipo>"`. Los clics se escuchan en este contenedor, no en `document`: con Cache Components Next deja
 * fichas anteriores montadas y ocultas, y un listener global contaría el clic para el sitio equivocado.
 * El HTML es el mismo para todos (va al CDN): la cuenta sale solo del navegador.
 */
export function SiteTracker({ siteId, children }: { siteId: string; children: ReactNode }) {
  useEffect(() => {
    const countView = () => {
      if (document.visibilityState !== "visible") return
      document.removeEventListener("visibilitychange", countView)
      analytics.track("view_item", { item_type: "site", item_id: siteId }) // Analytics: una por apertura de la ficha
      if (firstViewOfSession(siteId)) trackSite(siteId, "view")
    }
    if (document.visibilityState === "visible") countView()
    else document.addEventListener("visibilitychange", countView) // abierta en segundo plano: cuenta al verla
    return () => document.removeEventListener("visibilitychange", countView)
  }, [siteId])

  return (
    <div
      className="contents"
      onClickCapture={(e) => {
        const el = (e.target as HTMLElement).closest<HTMLElement>("[data-site-track]")
        const type = el?.dataset.siteTrack
        if (isSiteTrackType(type) && type !== "view") trackSite(siteId, type)
        const click = type ? siteClickEvent(siteId, type, (el as HTMLAnchorElement).href) : null
        if (click) analytics.track(click.name, click.params)
      }}
    >
      {children}
    </div>
  )
}
