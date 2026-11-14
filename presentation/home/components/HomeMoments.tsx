"use client"

import { useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "@/app/components/ui/navigation/IntentLink"
import { cn } from "@/app/lib/utils/cn"
import type { HomeView, LeadView, MomentView, RowView } from "../lib/buildHomeView"
import { HomeSearchBar } from "@/app/components/feature/home/HomeSearchBar"
import { DateChip } from "./DateChip"

const TAG_COLOR: Record<RowView["kind"], string> = { Evento: "text-primary-dark", Actividad: "text-amber-ink", Sitio: "text-muted-foreground" }
const FALLBACKS = ["bg-wine", "bg-primary-dark", "bg-brand-gold", "bg-primary", "bg-sand"]

function Cover({ src, i, sizes, priority, className }: { src: string | null; i: number; sizes: string; priority?: boolean; className?: string }) {
  return src ? <Image src={src} alt="" fill sizes={sizes} priority={priority} className={cn("object-cover", className)} /> : <span aria-hidden className={cn("absolute inset-0", FALLBACKS[i % FALLBACKS.length])} />
}

function Lead({ lead }: { lead: LeadView }) {
  return (
    <Link href={lead.href} className="group relative block min-h-53 overflow-hidden rounded-3xl bg-wine text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-72 lg:min-h-93">
      <Cover src={lead.cover} i={0} sizes="(min-width: 1024px) 28rem, 100vw" priority className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />
      <DateChip wd={lead.wd} day={lead.day} mon={lead.mon} className="absolute left-3 top-3 sm:left-4 sm:top-4" />
      <span className="absolute right-3 top-3 rounded-full bg-brand-gold px-3 py-1.5 text-[0.8125rem] font-semibold text-wine sm:right-4 sm:top-4">{lead.badge}</span>
      <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/40 to-transparent px-4 pb-3.5 pt-12 sm:px-5 sm:pb-4.5 sm:pt-16">
        <span className="block text-[0.8125rem] font-semibold text-white/90">{lead.kind}</span>
        <span className="block font-heading text-[1.375rem] font-bold leading-tight sm:text-3xl">{lead.title}</span>
        <span className="mt-1 block text-sm font-medium text-white/90">{lead.meta}</span>
      </span>
    </Link>
  )
}

function Row({ r, i }: { r: RowView; i: number }) {
  return (
    <li className="border-b border-border">
      <Link href={r.href} className="grid min-h-19 grid-cols-[3.25rem_3.5rem_minmax(0,1fr)] items-center gap-3 py-2 outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 sm:grid-cols-[3.5rem_3.75rem_minmax(0,1fr)] sm:gap-3.5">
        <span className="text-center leading-tight">
          <span className="block text-[0.8125rem] font-medium text-primary-dark">{r.pre}</span>
          <span className="block font-heading text-lg font-bold">{r.time}</span>
          <span className="block text-[0.8125rem] text-muted-foreground">{r.ampm}</span>
        </span>
        <span className="relative block size-14 overflow-hidden rounded-2xl sm:size-15"><Cover src={r.cover} i={i + 1} sizes="60px" /></span>
        <span className="min-w-0">
          <span className={cn("block text-[0.8125rem] font-semibold", TAG_COLOR[r.kind])}>{r.kind}</span>
          <span className="block text-[0.9375rem] font-semibold leading-snug">{r.title}</span>
          <span className="mt-0.5 block text-[0.8125rem] text-muted-foreground">{r.place}{r.price ? <> · <span className="font-semibold text-primary-dark">{r.price}</span></> : null}</span>
        </span>
      </Link>
    </li>
  )
}

function Moment({ m }: { m: MomentView }) {
  return (
    <div id={`momento-${m.key}`} className="flex h-full flex-col">
      <p className="mb-3 text-sm font-medium text-wine">{m.summary}</p>
      {/* flex-1: el principal y las filas llegan hasta abajo, a la misma altura que «Lo que viene» */}
      <div className="grid flex-1 gap-x-5 gap-y-3 lg:grid-cols-2">
        {m.lead ? <Lead lead={m.lead} /> : null}
        <div className={cn("flex min-w-0 flex-col", !m.lead && "lg:col-span-2")}>
          {m.rows.length ? <ul>{m.rows.map((r, i) => <Row key={r.key} r={r} i={i} />)}</ul> : null}
          <Link href={m.moreHref} className="mt-auto flex min-h-12 items-center justify-center rounded-full border-[1.5px] border-primary-dark text-[0.9375rem] font-semibold text-primary-dark outline-none transition-colors hover:bg-primary-light focus-visible:ring-3 focus-visible:ring-ring/50">{m.moreLabel}</Link>
        </div>
      </div>
    </div>
  )
}

/** Primer pantallazo: fecha, buscador, pestañas Hoy/Mañana/Finde/Semana y lo del momento elegido. Los cuatro momentos llegan ya calculados: cambiar de pestaña no pide nada. */
export function HomeMoments({ view, campaign, aside }: { view: HomeView; /** Franja de campaña: en escritorio va debajo, a todo el ancho. */ campaign?: ReactNode; /** «Lo que viene»: en escritorio va al lado, a la altura del resumen. */ aside?: ReactNode }) {
  const [sel, setSel] = useState<MomentView["key"]>("hoy")
  const m = view.moments.find((x) => x.key === sel) ?? view.moments[0]
  return (
    <div>
      <p className="text-sm font-medium text-primary-dark">{view.dateLabel}, Ibagué</p>
      <h1 className="mb-3.5 mt-1 font-heading text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl lg:text-[2.75rem]">¿Qué hay pa&apos; hacer hoy?</h1>
      {/* directo (no como propiedad desde el servidor): pasarlo como elemento hacía que React avisara de una `key` faltante */}
      <HomeSearchBar />
      <div role="group" aria-label="Cuándo" className="-mx-4 mt-3.5 flex gap-2 overflow-x-auto px-4 pb-3.5 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none]">
        {view.moments.map((t) => {
          const on = t.key === sel
          return (
            <button key={t.key} id={`tab-${t.key}`} type="button" aria-pressed={on} onClick={() => setSel(t.key)}
              className={cn("flex min-h-11 shrink-0 items-center gap-2 rounded-full border-[1.5px] px-3.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-4", on ? "border-primary-dark bg-primary-dark text-white" : "border-border bg-card hover:bg-muted")}>
              <span className="md:hidden">{t.label}</span><span className="hidden md:inline">{t.longLabel}</span>
              <span className={cn("grid h-5.5 min-w-5.5 place-items-center rounded-full px-1.5 text-xs", on ? "bg-brand-gold text-wine" : "bg-muted text-foreground")}>{t.count}</span>
            </button>
          )
        })}
      </div>
      {/* Móvil: momento → campaña → lo que viene. Escritorio: momento | lo que viene (alineados arriba), campaña debajo a lo ancho. */}
      <div className={aside ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-x-7 lg:gap-y-11 xl:grid-cols-[minmax(0,1fr)_23rem]" : "grid gap-6 lg:gap-y-11"}>
        <div className="flex min-w-0 flex-col lg:col-start-1 lg:row-start-1"><Moment m={m} /></div>
        {campaign ? <div className="min-w-0 lg:col-span-full lg:row-start-2">{campaign}</div> : null}
        {aside ? <aside className="min-w-0 lg:col-start-2 lg:row-start-1 [&>section]:h-full">{aside}</aside> : null}
      </div>
    </div>
  )
}
