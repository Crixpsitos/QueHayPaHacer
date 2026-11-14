"use client"

import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { Search } from "lucide-react"
import Link from "@/app/components/ui/navigation/IntentLink"
import { cn } from "@/app/lib/utils/cn"
import { useColombiaHolidays } from "../../hooks/useColombiaHolidays"
import { guiaStatus, type GuiaSite, type GuiaStatus as Status, type GuiaView } from "../../lib/buildGuia"
import type { GuiaPin } from "./GuiaMap"

// El mapa pesa (maplibre): se carga aparte y solo en el navegador; mientras tanto queda su recuadro reservado.
const GuiaMap = dynamic(() => import("./GuiaMap"), { ssr: false })

type Filter = "open" | "events" | "promos" | "free"
const PAGE = 12
/** Tarjetas a la vista en una página por tipo; el resto se abre con «Ver los N que faltan». */
const TYPE_FIRST = 6
const TILES = ["bg-primary-dark text-white", "bg-wine text-white", "bg-brand-gold text-wine", "bg-sand text-wine", "bg-primary text-white", "bg-brand-gold text-wine", "bg-primary-dark text-white"]
const FALLBACKS = ["bg-brand-gold", "bg-primary-dark", "bg-primary", "bg-sand", "bg-wine"]
const FLOAT = "shadow-[0_6px_20px_rgb(92_0_17/0.18)]"
const H2 = "font-heading text-[1.4375rem] font-bold leading-tight sm:text-[1.625rem]"
const GRID = "grid gap-2.5 sm:gap-3.5 md:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]"
const noop = () => () => {}
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
const hue = (id: string) => id.charCodeAt(0) + id.charCodeAt(id.length - 1)

function Cover({ s, sizes, priority }: { s: GuiaSite; sizes: string; priority?: boolean }) {
  return s.cover ? <Image src={s.cover} alt="" fill sizes={sizes} priority={priority} className="object-cover" /> : <span aria-hidden className={cn("absolute inset-0", FALLBACKS[hue(s.id) % FALLBACKS.length])} />
}

/** Tarjeta con número (el del mapa): foto, tipo, si está abierto y qué pasa ahí. */
function Card({ s, n, st, what, quiet, onHover }: { s: GuiaSite; n: number; st: Status; what: string | null; /** El texto es un dato del sitio (dirección), no algo que pasa. */ quiet?: boolean; onHover: (id: string | null) => void }) {
  return (
    <li onMouseEnter={() => onHover(s.id)} onMouseLeave={() => onHover(null)} className="group relative grid min-h-26 grid-cols-[6rem_minmax(0,1fr)] overflow-hidden rounded-[1.25rem] border border-border bg-card transition-shadow focus-within:ring-3 focus-within:ring-ring/50 hover:shadow-card sm:grid-cols-[6.75rem_minmax(0,1fr)]">
      <span className="relative block overflow-hidden">
        <Cover s={s} sizes="108px" />
        <span className="absolute left-2 top-2 grid size-7 place-items-center rounded-full border-2 border-white bg-primary-dark font-heading text-sm font-bold text-white">{n}</span>
      </span>
      <span className="min-w-0 px-3.5 py-3">
        <Link href={s.href} className="block font-heading text-[1.0625rem] font-bold leading-tight outline-none after:absolute after:inset-0 group-hover:underline sm:text-lg">{s.name}</Link>
        <span className="mt-0.5 block text-[0.8125rem] text-muted-foreground">{s.kind}{st.label ? <> · <span className={cn("font-semibold", st.isOpen && "text-green-900")}>{st.label}</span></> : null}</span>
        {what ? (
          <span className={cn("mt-2 flex items-start gap-2 border-t border-dashed border-border pt-2 text-[0.8125rem] font-medium", quiet ? "text-muted-foreground" : "text-wine")}>
            {quiet ? null : <span aria-hidden className="mt-1.25 size-2 shrink-0 rounded-full bg-brand-gold" />}{what}
          </span>
        ) : null}
      </span>
    </li>
  )
}

/** Fila compacta de «Todos los sitios». */
function Row({ s, st }: { s: GuiaSite; st: Status }) {
  return (
    <li className="group relative grid min-h-20 grid-cols-[3.75rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-border lg:min-h-21">
      <span className="relative block size-15 overflow-hidden rounded-[0.875rem]"><Cover s={s} sizes="60px" /></span>
      <span className="min-w-0">
        <Link href={s.href} className="block font-semibold leading-tight outline-none after:absolute after:inset-0 group-hover:underline group-focus-within:underline">{s.name}</Link>
        <span className="mt-0.5 block truncate text-[0.8125rem] text-muted-foreground">{s.kind}</span>
      </span>
      <span className={cn("max-w-28 text-right text-xs font-semibold", st.isOpen ? "text-green-900" : "text-muted-foreground")}>{st.short}</span>
    </li>
  )
}

/**
 * La guía de /donde-ir («index») y de sus páginas por tipo («type»): mapa con pines numerados que coinciden con la lista,
 * y en el índice además entrada por plan, buscador, filtros, destacados y todos los sitios. Todo se filtra en el navegador.
 */
export function Guia({ view, variant, listTitle = "En la guía", adTop, adMid }: {
  view: GuiaView
  variant: "index" | "type"
  /** Título de la lista en una página por tipo. */
  listTitle?: string
  adTop?: ReactNode
  adMid?: ReactNode
}) {
  const [q, setQ] = useState("")
  const [filters, setFilters] = useState<Set<Filter>>(new Set())
  const [sel, setSel] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [shown, setShown] = useState(PAGE)
  const [all, setAll] = useState(false)

  // «Abierto ahora» se pinta primero con la hora del servidor (la de la caché) y el navegador lo corrige con la suya.
  const isClient = useSyncExternalStore(noop, () => true, () => false)
  const holidays = useColombiaHolidays()
  const status = useMemo(() => {
    const now = isClient ? new Date() : new Date(view.now)
    return new Map(view.sites.map((s) => [s.id, guiaStatus(s, now, holidays)]))
  }, [view, isClient, holidays])
  const st = (s: GuiaSite): Status => status.get(s.id) ?? { isOpen: false, label: "", short: "" }

  const index = variant === "index"
  const needle = norm(q.trim())
  const filtering = !!needle || filters.size > 0
  const list = useMemo(() => view.sites.filter((s) =>
    (!needle || norm(`${s.name} ${s.kind} ${s.address}`).includes(needle))
    && (!filters.has("open") || status.get(s.id)?.isOpen)
    && (!filters.has("events") || s.live) && (!filters.has("promos") || s.promo) && (!filters.has("free") || s.free)), [view, needle, filters, status])
  // Los numerados: en el índice, los que tienen algo esta semana; en una página por tipo, todos (abiertos primero).
  const numbered = useMemo(() => index ? list.filter((s) => s.live || s.promo) : [...list].sort((a, b) => Number(status.get(b.id)?.isOpen ?? false) - Number(status.get(a.id)?.isOpen ?? false)), [index, list, status])
  const numberOf = useMemo(() => new Map(numbered.map((s, i) => [s.id, i + 1])), [numbered])
  const pins = useMemo(() => list.flatMap((s): GuiaPin[] => (s.lat && s.lng ? [{ id: s.id, name: s.name, lat: s.lat, lng: s.lng, n: numberOf.get(s.id) ?? null }] : [])), [list, numberOf])
  const hasMap = view.sites.some((s) => s.lat && s.lng)
  const activeId = hover ?? sel
  const active = activeId ? list.find((s) => s.id === activeId) : undefined
  const featured = index && !filtering ? view.featuredIds.flatMap((id) => view.sites.find((s) => s.id === id) ?? []) : []

  const chips: { key: Filter; label: string; any: boolean }[] = [
    { key: "open", label: "Abierto ahora", any: true },
    { key: "events", label: "Con eventos esta semana", any: view.sites.some((s) => s.live) },
    { key: "promos", label: "Con promos", any: view.sites.some((s) => s.promo) },
    { key: "free", label: "Entrada libre", any: view.sites.some((s) => s.free) },
  ]
  const toggle = (k: Filter) => { setFilters((f) => { const n = new Set(f); if (!n.delete(k)) n.add(k); return n }); setSel(null) }
  const clear = () => { setQ(""); setFilters(new Set()); setSel(null) }
  const openCount = view.sites.filter((s) => st(s).isOpen).length

  const map = hasMap ? (
    <div className="lg:sticky lg:top-4 lg:order-2">
      <div className="relative h-52.5 overflow-hidden rounded-3xl border border-border bg-sand/50 lg:h-[min(40rem,calc(100dvh-2rem))] lg:rounded-[1.75rem]">
        <GuiaMap pins={pins} activeId={activeId} onSelect={setSel} />
        {active ? (
          <Link href={active.href} className={cn("absolute inset-x-3 bottom-3 rounded-[1.25rem] bg-card px-4 py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/60 lg:inset-x-4 lg:bottom-4", FLOAT)}>
            <span className="block truncate font-heading text-[1.0625rem] font-bold text-foreground">{numberOf.has(active.id) ? `${numberOf.get(active.id)} · ` : ""}{active.name}</span>
            <span className="block truncate text-[0.8125rem] text-muted-foreground">{[active.kind, st(active).label].filter(Boolean).join(" · ")}</span>
            {active.live || active.promo ? <span className="mt-1 block truncate text-[0.8125rem] font-medium text-wine">{active.live ?? `Promo: ${active.promo}`}</span> : null}
          </Link>
        ) : (
          <Link href="/sites" className={cn("absolute bottom-3 right-3 flex min-h-11 items-center rounded-full bg-card px-4 text-sm font-semibold text-wine outline-none focus-visible:ring-3 focus-visible:ring-ring/60", FLOAT)}>Abrir el mapa</Link>
        )}
      </div>
    </div>
  ) : null

  const empty = (
    <div className="rounded-3xl bg-accent px-5 py-8 text-center text-wine">
      <p className="font-heading text-xl font-bold">{view.sites.length ? "Ningún lugar coincide" : "Todavía no hay lugares aquí"}</p>
      <p className="mt-1 text-sm text-amber-ink">{view.sites.length ? "Prueba con otra palabra o quita los filtros." : "Si conoces uno, agrégalo gratis y sale en la guía y en el mapa."}</p>
      {view.sites.length ? <button type="button" onClick={clear} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-primary-dark px-5 text-sm font-semibold text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50">Ver toda la guía</button> : null}
    </div>
  )
  const columns = cn("flex flex-col gap-6", hasMap && "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(21rem,27rem)] lg:items-start lg:gap-7")

  if (!index) {
    const visible = all ? numbered : numbered.slice(0, TYPE_FIRST)
    return (
      <div className={columns}>
        {map}
        <div className="min-w-0">
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <h2 className={H2}>{listTitle}</h2>
            {numbered.length > 1 ? <span className="shrink-0 text-[0.8125rem] font-semibold text-primary-dark">Abiertos primero</span> : null}
          </div>
          {numbered.length ? (
            <>
              <ul className={GRID}>{visible.map((s) => <Card key={s.id} s={s} n={numberOf.get(s.id) ?? 0} st={st(s)} what={s.live ?? (s.promo ? `Promo: ${s.promo}` : s.address || null)} quiet={!s.live && !s.promo} onHover={setHover} />)}</ul>
              {visible.length < numbered.length ? <button type="button" onClick={() => setAll(true)} className="mt-4 flex min-h-12.5 w-full items-center justify-center rounded-full border-[1.5px] border-primary-dark font-semibold text-primary-dark outline-none transition-colors hover:bg-primary-light focus-visible:ring-3 focus-visible:ring-ring/50">Ver los {numbered.length - visible.length} que faltan</button> : null}
            </>
          ) : empty}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3.5">
        <div>
          <h1 className="font-heading text-[2rem] font-extrabold leading-[1.05] tracking-tight sm:text-[2.875rem]">¿Dónde ir en Ibagué?</h1>
          <p className="mt-1.5 text-[0.9375rem] text-muted-foreground sm:text-base">
            {view.sites.length ? `${view.sites.length} ${view.sites.length === 1 ? "lugar" : "lugares"} en la guía.${openCount ? ` ${openCount === 1 ? "1 está abierto" : `${openCount} están abiertos`} ahora.` : ""}` : "La guía de la ciudad, por plan y con mapa."}
          </p>
        </div>
        <label className="flex h-12 w-full items-center gap-2.5 rounded-full border-[1.5px] border-border bg-card px-4 focus-within:border-primary-dark sm:w-85">
          <Search className="size-4.5 shrink-0 text-muted-foreground" aria-hidden />
          <input id="guia-buscar" type="search" value={q} onChange={(e) => { setQ(e.target.value); setSel(null) }} placeholder="Busca un lugar o un antojo" aria-label="Buscar en la guía" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
        </label>
      </div>

      {view.plans.length ? (
        <nav aria-labelledby="guia-planes">
          <h2 id="guia-planes" className={cn(H2, "mb-3 sm:sr-only")}>¿Qué plan tienes?</h2>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] sm:gap-3">
            {view.plans.map((p, i) => (
              <li key={p.key} className={cn(i === 0 && view.plans.length % 2 === 1 && "col-span-2 sm:col-span-1")}>
                <Link href={p.href} className={cn("relative flex h-26 flex-col justify-end overflow-hidden rounded-[1.25rem] p-3.5 outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/60 motion-reduce:transition-none sm:h-34 sm:rounded-[1.375rem]", i === 0 && view.plans.length % 2 === 1 && "h-31", TILES[i % TILES.length])}>
                  <span className="absolute right-3 top-3 grid h-6.5 min-w-6.5 place-items-center rounded-full bg-white px-2 text-[0.8125rem] font-semibold text-wine">{p.count}</span>
                  <span className="font-heading text-xl font-bold leading-tight">{p.label}</span>
                  <span className="text-[0.8125rem] font-medium">{p.sub}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {view.sites.length ? (
        <div role="group" aria-label="Filtros" className="sticky top-0 z-20 -mx-4 flex gap-2 overflow-x-auto bg-background px-4 py-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:py-0">
          {chips.filter((c) => c.any).map((c) => {
            const on = filters.has(c.key)
            return (
              <button key={c.key} type="button" aria-pressed={on} onClick={() => toggle(c.key)}
                className={cn("flex min-h-11 shrink-0 items-center gap-2 rounded-full border-[1.5px] px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50", on ? "border-primary-dark bg-primary-dark text-white" : "border-border bg-card hover:bg-muted")}>
                {c.key === "open" ? <span aria-hidden className={cn("size-2 rounded-full", on ? "bg-brand-gold" : "bg-green-700")} /> : null}{c.label}
              </button>
            )
          })}
        </div>
      ) : null}

      {list.length ? (
        <div className={columns}>
          {map}
          <div className="flex min-w-0 flex-col gap-7">
            {numbered.length ? (
              <section aria-labelledby="guia-semana">
                <h2 id="guia-semana" className={H2}>Con algo esta semana</h2>
                <p className="mb-3 mt-0.5 text-sm text-muted-foreground">{hasMap ? "El número es el del mapa." : "Su próximo evento o su promoción."}</p>
                <ul className={GRID}>{numbered.map((s) => <Card key={s.id} s={s} n={numberOf.get(s.id) ?? 0} st={st(s)} what={s.live ?? `Promo: ${s.promo}`} onHover={setHover} />)}</ul>
              </section>
            ) : null}
            {adTop}

            {featured.length ? (
              <section aria-labelledby="guia-destacados" className="lg:hidden">
                <h2 id="guia-destacados" className={cn(H2, "mb-3")}>Destacados</h2>
                <Link href={featured[0].href} className="group relative block h-57.5 overflow-hidden rounded-3xl bg-wine text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/60">
                  <Cover s={featured[0]} sizes="100vw" />
                  <span className="absolute left-3 top-3 rounded-full bg-brand-gold px-3 py-1.5 text-[0.8125rem] font-semibold text-wine">{featured[0].likes > 0 ? "El más guardado" : "Destacado"}</span>
                  <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-4 pb-3.5 pt-15">
                    <span className="block font-heading text-[1.4375rem] font-bold leading-tight group-hover:underline">{featured[0].name}</span>
                    <span className="mt-1 block text-sm font-medium">{[featured[0].kind, st(featured[0]).label].filter(Boolean).join(" · ")}</span>
                  </span>
                </Link>
                {featured.length > 1 ? (
                  <ul className="mt-2.5 grid grid-cols-2 gap-2.5">
                    {featured.slice(1).map((s) => (
                      <li key={s.id}>
                        <Link href={s.href} className="group block outline-none">
                          <span className="relative block h-29.5 overflow-hidden rounded-[1.25rem] group-focus-visible:ring-3 group-focus-visible:ring-ring/60"><Cover s={s} sizes="50vw" /></span>
                          <span className="mt-2 block font-heading text-base font-bold leading-tight group-hover:underline">{s.name}</span>
                          <span className="block text-[0.8125rem] text-muted-foreground">{s.kind}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ) : null}
            {adMid}

            <section aria-labelledby="guia-todos">
              <div className="mb-1 flex items-baseline justify-between gap-3 sm:justify-start sm:gap-3.5">
                <h2 id="guia-todos" className={H2}>{filtering ? "Lo que encontramos" : "Todos los sitios"}</h2>
                <span className="shrink-0 text-[0.8125rem] font-semibold text-primary-dark sm:text-sm">{list.length} {list.length === 1 ? "lugar" : "lugares"}</span>
              </div>
              <ul className="grid gap-x-7 md:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]">{list.slice(0, shown).map((s) => <Row key={s.id} s={s} st={st(s)} />)}</ul>
              {shown < list.length ? <button type="button" onClick={() => setShown((n) => n + PAGE)} className="mx-auto mt-5 flex min-h-12.5 w-full max-w-80 items-center justify-center rounded-full border-[1.5px] border-primary-dark font-semibold text-primary-dark outline-none transition-colors hover:bg-primary-light focus-visible:ring-3 focus-visible:ring-ring/50">Cargar más sitios</button> : null}
            </section>
          </div>
        </div>
      ) : empty}
    </div>
  )
}
