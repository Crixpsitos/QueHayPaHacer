"use client"

import { useEffect, type ReactNode } from "react"
import { firstViewOfSession, trackSite } from "@/app/lib/siteTrack"
import { isSiteTrackType } from "@/domain/entities/sites/siteStats"

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
        const type = (e.target as HTMLElement).closest<HTMLElement>("[data-site-track]")?.dataset.siteTrack
        if (isSiteTrackType(type) && type !== "view") trackSite(siteId, type)
      }}
    >
      {children}
    </div>
  )
}
