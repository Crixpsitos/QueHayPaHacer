"use client"

import { useEffect, useState } from "react"
import { ChevronDown, MapPin } from "lucide-react"
import { HubMapLazy } from "./HubMapLazy"
import type { HubMapData } from "@/presentation/activities/data/fetchers"

type Data = HubMapData
const KEY = "qhpa-hub-map"

/**
 * El mapa del hub plegable: cerrado por defecto (ocupa media pantalla y empuja las actividades hacia abajo) y se acuerda lo que
 * elijas. Cerrado no se carga el mapa (menos peso). `data` null = datos en camino (el botón ya es interactivo). Los días y filtros de arriba siguen mandando igual.
 */
export function HubMapToggle({ data }: { data: Data | null }) {
  const [open, setOpen] = useState(false)
  useEffect(() => { try { if (localStorage.getItem(KEY) === "open") setOpen(true) } catch { /* sin almacenamiento: cerrado */ } }, [])
  const toggle = () => { const next = !open; setOpen(next); try { localStorage.setItem(KEY, next ? "open" : "closed") } catch { /* se pierde solo la preferencia */ } }
  return (
    <section aria-label="Mapa de actividades" className="grid gap-3">
      <button type="button" onClick={toggle} aria-expanded={open} className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card px-4 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/40">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-light text-primary-dark"><MapPin className="size-5" aria-hidden /></span>
        <span className="grid min-w-0 flex-1 leading-tight"><span className="font-heading text-base font-bold">{open ? "Ocultar el mapa" : "Ver el mapa"}</span><span className="text-sm text-muted-foreground">Dónde pasa cada plan y qué hay a cada hora</span></span>
        <ChevronDown className={`size-5 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open ? (data ? <HubMapLazy data={data} /> : <div className="h-[30rem] animate-pulse rounded-[2rem] bg-muted" aria-hidden />) : null}
    </section>
  )
}
