"use client"

import { useEffect, useRef } from "react"

/** Bloque de AdSense (el del script de `app/layout.tsx`). Se pide una sola vez por montaje; si Google no tiene anuncio, `globals.css` lo oculta. */
export const AD_CLIENT = "ca-pub-7393386666374848"
const FEED_SLOT = "3753503510" // In-feed, estilo «Imagen arriba»: dentro de los listados
const FEED_LAYOUT_KEY = "-6s+ed+2g-1n-4q"
const DISPLAY_SLOT = "2440421842" // Display responsivo: franjas de página

export function AdUnit({ kind }: { kind: "feed" | "display" }) {
  const pushed = useRef(false)
  useEffect(() => {
    if (pushed.current) return
    pushed.current = true
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] }
      ;(w.adsbygoogle = w.adsbygoogle || []).push({})
    } catch { /* bloqueador de anuncios o script aún sin cargar: la página sigue igual */ }
  }, [])
  return kind === "feed"
    ? <ins className="adsbygoogle" style={{ display: "block" }} data-ad-format="fluid" data-ad-layout-key={FEED_LAYOUT_KEY} data-ad-client={AD_CLIENT} data-ad-slot={FEED_SLOT} />
    : <ins className="adsbygoogle" style={{ display: "block" }} data-ad-client={AD_CLIENT} data-ad-slot={DISPLAY_SLOT} data-ad-format="auto" data-full-width-responsive="true" />
}
