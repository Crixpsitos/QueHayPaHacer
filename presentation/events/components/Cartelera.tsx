"use client"

import { useMemo, useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "@/app/components/ui/navigation/IntentLink"
import { cn } from "@/app/lib/utils/cn"
import { DateChip } from "@/presentation/home/components/DateChip"
import { groupCartelera, inDays, type CarteleraEvent, type CarteleraView } from "../lib/buildCartelera"

type When = "todos" | "hoy" | "manana" | "finde" | "mes" | "gratis"
const STEP = 40
const FALLBACKS = ["bg-wine", "bg-primary-dark", "bg-brand-gold", "bg-primary", "bg-sand"]
const PANEL = "lg:rounded-3xl lg:border lg:border-border lg:bg-card lg:p-4"
const PANEL_TITLE = "mb-2 hidden font-heading text-[1.0625rem] font-bold lg:block"

function Cover({ src, i, sizes, priority }: { src: string | null; i: number; sizes: string; priority?: boolean }) {
  return src ? <Image src={src} alt="" fill sizes={sizes} priority={priority} className="object-cover" /> : <span aria-hidden className={cn("absolute inset-0", FALLBACKS[i % FALLBACKS.length])} />
}

/** Boleta: foto, qué es y dónde, y en el talón la hora (o la fecha) y el precio. */
function Ticket({ e, i, byDay }: { e: CarteleraEvent; i: number; byDay: boolean }) {
  return (
    <li>
      <Link href={e.href} className="group relative grid min-h-26 grid-cols-[5.25rem_minmax(0,1fr)_4.875rem] overflow-hidden rounded-[1.125rem] border border-border bg-card outline-none transition-shadow hover:shadow-card focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-28 sm:grid-cols-[6.5rem_minmax(0,1fr)_5.5rem]">
        <span className="relative block overflow-hidden"><Cover src={e.cover} i={i} sizes="104px" /></span>
        <span className="flex min-w-0 flex-col justify-center gap-0.5 py-3 pl-3 pr-2.5 sm:pl-3.5">
          <span className="line-clamp-2 text-[0.9375rem] font-semibold leading-snug group-hover:underline sm:text-base">{e.title}</span>
          {e.venue ? <span className="truncate text-[0.8125rem] text-muted-foreground">{e.venue}</span> : null}
          {e.tag ? <span className="truncate text-xs font-semibold text-amber-ink">{e.tag}</span> : null}
        </span>
        <span className="flex flex-col items-center justify-center gap-0.5 border-l-2 border-dashed border-border px-1 text-center">
          {byDay ? null : <span className="text-xs font-medium text-muted-foreground">{e.wd}</span>}
          <span className="font-heading text-[1.1875rem] font-bold leading-none sm:text-[1.3125rem]">{byDay ? e.time : e.day}</span>
          <span className="text-xs text-muted-foreground">{byDay ? e.ampm : e.mon}</span>
          <span className="mt-1 text-xs font-semibold leading-tight text-primary-dark sm:text-[0.8125rem]">{e.price}</span>
        </span>
        {/* muescas de la boleta */}
        <span aria-hidden className="absolute -top-2 right-[4.375rem] size-4 rounded-full border border-border bg-background sm:right-20" />
        <span aria-hidden className="absolute -bottom-2 right-[4.375rem] size-4 rounded-full border border-border bg-background sm:right-20" />
      </Link>
    </li>
  )
}

/** La cartelera de /eventos: destacado del momento, filtros por «cuándo» y por día, y las boletas agrupadas por fecha. Todo se filtra en el navegador. */
export function Cartelera({ view, cats, ad }: { view: CarteleraView; cats: { label: string; href: string; count: number }[]; ad?: ReactNode }) {
  const [when, setWhen] = useState<When>("todos")
  const [day, setDay] = useState<string | null>(null)
  const [limit, setLimit] = useState(STEP)

  const match = useMemo(() => {
    const ranges: Record<Exclude<When, "todos" | "gratis">, [string, string]> = { hoy: [view.today, view.today], manana: [view.tomorrow, view.tomorrow], finde: [view.weekend.from, view.weekend.to], mes: [view.today, view.monthEnd] }
    return (w: When) => (e: CarteleraEvent) => (w === "todos" ? true : w === "gratis" ? e.free : inDays(e, ...ranges[w]))
  }, [view])

  const whens: { key: When; label: string; short: string }[] = [
    { key: "todos", label: "Todos los que vienen", short: "Todos" },
    { key: "hoy", label: "Hoy", short: "Hoy" },
    { key: "manana", label: "Mañana", short: "Mañana" },
    { key: "finde", label: "Este fin de semana", short: "Finde" },
    { key: "mes", label: "Este mes", short: "Este mes" },
    { key: "gratis", label: "Gratis", short: "Gratis" },
  ]
  const filtered = useMemo(() => (day ? view.events.filter((e) => inDays(e, day, day)) : view.events.filter(match(when))), [view, day, when, match])
  // Con un día o un rango elegido, lo que ya empezó se muestra dentro de ese día (no en «hoy»).
  const shown = useMemo(() => {
    const from = day ?? (when === "manana" ? view.tomorrow : when === "finde" ? view.weekend.from : null)
    return (from ? filtered.map((e) => (e.date < from ? { ...e, date: from } : e)) : filtered).slice(0, limit)
  }, [filtered, day, when, view, limit])
  const groups = useMemo(() => groupCartelera(shown, view.today), [shown, view.today])
  const pick = (w: When) => { setWhen(w); setDay(null); setLimit(STEP) }
  const spot = view.spotlight

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[19.5rem_minmax(0,1fr)] lg:items-start lg:gap-x-8 lg:gap-y-7">
      {/* En móvil los filtros van sueltos entre el destacado y las boletas; en escritorio forman la columna lateral. */}
      <aside className="contents lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-4">
        <div role="group" aria-label="Cuándo" className={cn("order-2 -mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:order-none lg:flex-col lg:gap-0 lg:overflow-visible", PANEL)}>
          <p className={PANEL_TITLE}>Cuándo</p>
          {whens.map((w) => {
            const on = !day && when === w.key
            const n = view.events.filter(match(w.key)).length
            return (
              <button key={w.key} type="button" aria-pressed={on} onClick={() => pick(w.key)}
                className={cn("flex min-h-11 shrink-0 items-center justify-between gap-2 rounded-full border-[1.5px] px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 lg:rounded-xl lg:border-0 lg:px-3", on ? "border-primary-dark bg-primary-dark text-white" : "border-border bg-card hover:bg-muted")}>
                <span className="lg:hidden">{w.short}</span><span className="hidden lg:inline">{w.label}</span>
                <span className={cn("text-[0.8125rem]", on ? "text-brand-gold" : "text-primary-dark")}>{n}</span>
              </button>
            )
          })}
        </div>

        {cats.length ? (
          <div className={cn("order-3 lg:order-2", PANEL)}>
            <p className={PANEL_TITLE}>Por gusto</p>
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:flex-wrap lg:overflow-visible">
              {cats.map((c) => (
                <li key={c.href} className="shrink-0"><Link href={c.href} className="flex min-h-11 items-center gap-1.5 rounded-full bg-accent px-3.5 text-sm font-medium text-wine outline-none hover:bg-brand-gold/40 focus-visible:ring-3 focus-visible:ring-ring/50">{c.label}<span className="font-semibold">{c.count}</span></Link></li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="order-4 rounded-3xl border border-border bg-card p-3 pt-3.5 lg:order-1">
          <p className="mb-1.5 px-1 font-heading text-[1.0625rem] font-bold">Próximos 14 días</p>
          <div className="grid grid-cols-7 gap-1">
            {view.calendar.map((d) => {
              const on = day === d.date
              return (
                <button key={d.date} type="button" disabled={!d.count} aria-pressed={on} aria-label={`${d.wd} ${d.day}: ${d.count} ${d.count === 1 ? "evento" : "eventos"}`}
                  onClick={() => { setDay(on ? null : d.date); setWhen("todos"); setLimit(STEP) }}
                  className={cn("flex min-h-15 flex-col items-center gap-0.5 rounded-xl pt-1.5 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50", on ? "bg-primary-dark text-white" : d.count ? "hover:bg-muted" : "text-muted-foreground/70")}>
                  <span className="text-xs font-medium">{d.wd}</span>
                  <span className="font-heading text-base font-bold leading-none">{d.day}</span>
                  <span className={cn("grid h-4 min-w-4.5 place-items-center rounded-full px-1 text-xs font-semibold text-wine", d.count ? "bg-brand-gold" : "")}>{d.count || ""}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 px-1 text-[0.8125rem] text-muted-foreground">El número dorado dice cuántos eventos hay ese día. Toca un día para ver solo esos.</p>
        </div>
        {ad ? <div className="order-6 lg:order-3">{ad}</div> : null}
      </aside>

      {spot ? (
        <Link href={spot.href} className="group relative order-1 block min-h-64 overflow-hidden rounded-3xl bg-wine text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-80 lg:order-none lg:col-start-2 lg:row-start-1">
          <Cover src={spot.cover} i={0} sizes="(min-width: 1024px) 60vw, 100vw" priority />
          <DateChip wd={spot.wd} day={spot.day} mon={spot.mon} className="absolute left-3 top-3 sm:left-5 sm:top-5" />
          <span className="absolute right-3 top-3 rounded-full bg-brand-gold px-3.5 py-1.5 text-sm font-semibold text-wine sm:right-5 sm:top-5">{spot.badge}</span>
          <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/40 to-transparent px-4 pb-4 pt-16 sm:px-6 sm:pb-5 sm:pt-20">
            <span className="block font-heading text-[1.625rem] font-bold leading-tight group-hover:underline sm:text-[2.125rem]">{spot.title}</span>
            <span className="mt-1.5 block text-sm font-medium text-white/90 sm:text-base">{[spot.venue, spot.price, spot.tag].filter(Boolean).join(" · ")}</span>
          </span>
        </Link>
      ) : null}

      <div className="order-5 min-w-0 lg:order-none lg:col-start-2 lg:row-start-2">
        {groups.length ? (
          <div className="flex flex-col gap-6 sm:gap-7">
            {groups.map((g) => (
              <section key={g.key} aria-labelledby={`dia-${g.key}`}>
                <div className="mb-2.5 flex items-baseline justify-between gap-3 sm:justify-start sm:gap-3.5">
                  <h2 id={`dia-${g.key}`} className={cn("font-heading font-bold leading-tight", g.big ? "text-[1.75rem] sm:text-[2.125rem]" : "text-[1.375rem] sm:text-[1.625rem]")}>{g.title}</h2>
                  <span className="shrink-0 text-[0.8125rem] font-semibold text-primary-dark sm:text-sm">{g.items.length} {g.items.length === 1 ? "evento" : "eventos"}</span>
                </div>
                <ul className="grid gap-2.5 sm:gap-3.5 md:grid-cols-[repeat(auto-fill,minmax(22.5rem,1fr))]">
                  {g.items.map((e, i) => <Ticket key={e.id} e={e} i={i} byDay={g.byDay} />)}
                </ul>
              </section>
            ))}
            {filtered.length > limit ? (
              <button type="button" onClick={() => setLimit((n) => n + STEP)} className="mx-auto flex min-h-12 w-full max-w-80 items-center justify-center rounded-full border-[1.5px] border-primary-dark text-[0.9375rem] font-semibold text-primary-dark outline-none transition-colors hover:bg-primary-light focus-visible:ring-3 focus-visible:ring-ring/50">Cargar más eventos</button>
            ) : null}
          </div>
        ) : (
          <div className="rounded-3xl bg-accent px-5 py-8 text-center text-wine">
            <p className="font-heading text-xl font-bold">{view.total ? "No hay eventos para ese filtro" : "Todavía no hay eventos publicados"}</p>
            <p className="mt-1 text-sm text-amber-ink">{view.total ? "Prueba con otro día o mira todos los que vienen." : "Si conoces uno, publícalo gratis y sale aquí."}</p>
            {view.total ? <button type="button" onClick={() => pick("todos")} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-primary-dark px-5 text-sm font-semibold text-white">Ver todos los que vienen</button> : null}
          </div>
        )}
      </div>
    </div>
  )
}
