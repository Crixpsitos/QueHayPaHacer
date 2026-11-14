"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "@/app/components/ui/navigation/IntentLink"
import { cn } from "@/app/lib/utils/cn"

/**
 * Carril de tarjetas que se desliza hacia el lado (sin barra visible). Móvil: sangra a los dos bordes; desde sm sangra solo a la
 * derecha, 24 px (el margen del Home), para que se vea que hay más. `relative` hace que lo oculto (sr-only) de las tarjetas
 * se recorte con el carril y no ensanche la página.
 */
export const RAIL_CLASS =
  "relative -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-2 pt-1 sm:mx-0 sm:ml-0 sm:gap-5 sm:scroll-pl-0 sm:pl-0 sm:-mr-6 sm:pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"

/** Ancho de cada tarjeta dentro del carril: 244 px en móvil, 280 px en pantallas grandes. */
export const RAIL_ITEM_CLASS = "w-61 shrink-0 snap-start sm:w-70"

/** Flechas del carril (solo desde sm; en el celular se desliza con el dedo). Mueven el elemento con ese `id`. */
export function RailArrows({ targetId }: { targetId: string }) {
  const [edge, setEdge] = useState({ start: true, end: false })
  useEffect(() => {
    const el = document.getElementById(targetId)
    if (!el) return
    const update = () => setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
    update()
    el.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update) }
  }, [targetId])
  const go = (dir: 1 | -1) => {
    const el = document.getElementById(targetId)
    el?.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
  }
  if (edge.start && edge.end) return null // todo cabe: no hay nada que deslizar
  const cls = "grid size-9 place-items-center rounded-full border border-border bg-card text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:text-muted-foreground/60 disabled:hover:bg-card"
  return (
    <div className="ml-3.5 hidden gap-2 sm:flex">
      <button type="button" aria-label="Anteriores" disabled={edge.start} onClick={() => go(-1)} className={cls}><ChevronLeft className="size-4" aria-hidden /></button>
      <button type="button" aria-label="Siguientes" disabled={edge.end} onClick={() => go(1)} className={cls}><ChevronRight className="size-4" aria-hidden /></button>
    </div>
  )
}

/** Título de una sección con carril: título + pista a la izquierda, enlace y flechas a la derecha. */
export function RailHeader({ id, title, hint, href, linkLabel, targetId, className }: { id: string; title: string; hint?: string; href: string; linkLabel: string; targetId: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-x-4", className)}>
      <div className="min-w-0 flex-1">
        <h2 id={id} className="font-heading text-[1.4375rem] font-bold sm:text-[1.75rem]">{title}</h2>
        {hint ? <p className="mt-1 text-sm text-muted-foreground sm:text-[0.9375rem]">{hint}</p> : null}
      </div>
      <Link href={href} className="flex min-h-11 shrink-0 items-center text-sm font-semibold text-primary-dark underline-offset-2 hover:underline sm:text-[0.9375rem]">{linkLabel}</Link>
      <RailArrows targetId={targetId} />
    </div>
  )
}
