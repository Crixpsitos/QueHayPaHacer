"use client"

import { useMemo, useState, type ReactNode } from "react"
import Image from "next/image"
import { CalendarCheck } from "lucide-react"
import Link from "@/app/components/ui/navigation/IntentLink"
import { cn } from "@/app/lib/utils/cn"
import { DateChip } from "@/presentation/home/components/DateChip"
import { useOptimisticLike } from "@/presentation/shared/hooks/useOptimisticLike"
import { compactCount, goingLabel } from "./card/cardMeta"
import { useEventLikes } from "../hooks/useEventLikes"
import { groupCartelera, inDays, type CarteleraEvent, type CarteleraView } from "../lib/buildCartelera"

type When = "todos" | "hoy" | "manana" | "finde" | "mes" | "gratis"
type OnLike = (eventId: string, liked: boolean) => Promise<boolean>
/** Boletas a la vista por grupo; el resto se abre con «Ver los N…». */
const PER_GROUP = 4
/** «Voy a ir» se consulta solo para los primeros eventos (una lectura por evento y persona). */
const LIKES_MAX = 40
const FALLBACKS = ["bg-wine", "bg-primary-dark", "bg-brand-gold", "bg-primary", "bg-sand"]
const PANEL = "lg:rounded-3xl lg:border lg:border-border lg:bg-card lg:p-4"
const PANEL_TITLE = "mb-2 hidden font-heading text-[1.0625rem] font-bold lg:block"

function Cover({ src, i, sizes, priority }: { src: string | null; i: number; sizes: string; priority?: boolean }) {
  return src ? <Image src={src} alt="" fill sizes={sizes} priority={priority} className="object-cover" /> : <span aria-hidden className={cn("absolute inset-0", FALLBACKS[i % FALLBACKS.length])} />
}

const stats = (going: number, views: number) => [going > 0 ? goingLabel(going) : "", views > 0 ? `${compactCount(views)} vistas` : ""].filter(Boolean).join(" · ")

/** Boleta: foto, qué es, dónde, cómo se entra y cuántos van; en el talón la hora (o la fecha), el precio y «Voy a ir». */
function Ticket({ e, i, byDay, liked, onLike }: { e: CarteleraEvent; i: number; byDay: boolean; liked: boolean; onLike: OnLike }) {
  const like = useOptimisticLike(liked, e.going, (next) => onLike(e.id, next))
  const line = stats(like.count, e.views)
  return (
    <li className="group relative grid min-h-37 grid-cols-[4.875rem_minmax(0,1fr)_6rem] overflow-hidden rounded-[1.25rem] border border-border bg-card transition-shadow focus-within:ring-3 focus-within:ring-ring/50 hover:shadow-card sm:min-h-38 sm:grid-cols-[6.5rem_minmax(0,1fr)_7.5rem]">
      <span className="relative block overflow-hidden"><Cover src={e.cover} i={i} sizes="104px" /></span>
      <span className="flex min-w-0 flex-col justify-center gap-0.5 py-3 pl-3 pr-2.5 sm:pl-3.5">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {e.category ? <span className="text-xs font-semibold text-primary">{e.category}</span> : null}
          {e.multi ? <span className="whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-wine">{e.multi}</span> : null}
        </span>
        {/* Enlace estirado: toda la boleta lleva al evento; «Voy a ir» queda encima. */}
        <Link href={e.href} className="line-clamp-2 text-[0.9375rem] font-semibold leading-snug outline-none after:absolute after:inset-0 group-hover:underline sm:text-base">{e.title}</Link>
        {e.place ? <span className="truncate text-[0.8125rem] text-muted-foreground">{e.place}</span> : null}
        {e.info ? <span className="truncate text-xs font-semibold text-amber-ink">{e.info}</span> : null}
        {line ? <span className="truncate text-xs text-muted-foreground">{line}</span> : null}
      </span>
      <span className="flex flex-col items-center justify-center gap-px border-l-2 border-dashed border-border px-1.5 py-2.5 text-center">
        {byDay ? null : <span className="text-xs font-medium text-muted-foreground">{e.wd}</span>}
        <span className="font-heading text-[1.1875rem] font-bold leading-none sm:text-[1.375rem]">{byDay ? e.time : e.day}</span>
        <span className="text-xs text-muted-foreground">{byDay ? e.ampm : e.mon}</span>
        <span className="mt-1 text-[0.8125rem] font-semibold leading-tight text-primary-dark">{e.price}</span>
        {e.tiers ? <span className="text-xs text-muted-foreground">{e.tiers}</span> : null}
        <button type="button" aria-pressed={like.liked} onClick={like.toggle}
          className={cn("relative z-10 mt-1.5 flex min-h-8 items-center gap-1 whitespace-nowrap rounded-full border-[1.5px] border-primary-dark px-2.5 text-xs font-semibold outline-none transition-colors before:absolute before:-inset-1.5 focus-visible:ring-3 focus-visible:ring-ring/50", like.liked ? "bg-primary-dark text-white" : "bg-card text-primary-dark hover:bg-primary-light")}>
          <CalendarCheck className="hidden size-3.5 sm:block" aria-hidden />{like.liked ? "Vas a ir" : "Voy a ir"}
        </button>
      </span>
      {/* muescas de la boleta */}
      <span aria-hidden className="absolute -top-2 right-[5.5rem] size-4 rounded-full border border-border bg-background sm:right-28" />
      <span aria-hidden className="absolute -bottom-2 right-[5.5rem] size-4 rounded-full border border-border bg-background sm:right-28" />
    </li>
  )
}

function Spotlight({ spot, liked, onLike }: { spot: NonNullable<CarteleraView["spotlight"]>; liked: boolean; onLike: OnLike }) {
  const like = useOptimisticLike(liked, spot.going, (next) => onLike(spot.id, next))
  const line = [stats(like.count, spot.views), spot.info].filter(Boolean).join(" · ")
  return (
    <div className="group relative order-1 min-h-72 overflow-hidden rounded-3xl bg-wine text-white focus-within:ring-3 focus-within:ring-ring/50 sm:min-h-85 lg:order-none">
      <Cover src={spot.cover} i={0} sizes="(min-width: 1024px) 65vw, 100vw" priority />
      <DateChip wd={spot.wd} day={spot.day} mon={spot.mon} className="absolute left-3 top-3 sm:left-5 sm:top-5" />
      <span className="absolute right-3 top-3 rounded-full bg-brand-gold px-3.5 py-1.5 text-sm font-semibold text-wine sm:right-5 sm:top-5">{spot.badge}</span>
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/45 to-transparent px-4 pb-4 pt-16 sm:px-6 sm:pb-6 sm:pt-20">
        <span className="mb-1.5 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">{[spot.category, spot.multi || "Una fecha"].filter(Boolean).join(" · ")}</span>
        <Link href={spot.href} className="block font-heading text-[1.625rem] font-bold leading-tight text-white outline-none after:absolute after:inset-0 group-hover:underline sm:text-4xl">{spot.title}</Link>
        <span className="mt-1.5 block text-sm font-medium text-white/90 sm:text-[0.9375rem]">{[spot.place, spot.price, spot.tiers].filter(Boolean).join(" · ")}</span>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="button" aria-pressed={like.liked} onClick={like.toggle} className={cn("relative z-10 flex min-h-11 items-center gap-1.5 rounded-full px-4.5 text-[0.9375rem] font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-white/70", like.liked ? "bg-white text-wine" : "bg-brand-gold text-wine hover:bg-brand-gold/90")}>
            <CalendarCheck className="size-4" aria-hidden />{like.liked ? "Vas a ir" : "Voy a ir"}
          </button>
          {line ? <span className="text-sm text-white/90">{line}</span> : null}
        </div>
      </div>
    </div>
  )
}

/**
 * La cartelera de /eventos y de sus variantes por categoría: destacado del momento, filtros por «cuándo» y por día que siguen
 * al usuario al bajar, y las boletas agrupadas por fecha. Todo se filtra en el navegador.
 */
export function Cartelera({ view, cats, allLabel = "Todos los que vienen", catsTitle = "Por gusto", spotlight = true, featured, ad }: {
  view: CarteleraView
  cats: { label: string; href: string; count: number; current?: boolean }[]
  /** Nombre del filtro «todos» («Toda la música» en una variante). */
  allLabel?: string
  catsTitle?: string
  /** Las variantes no llevan evento principal: su cabecera ya dice qué es. */
  spotlight?: boolean
  /** Carril de destacados (llega ya renderizado desde el servidor). */
  featured?: ReactNode
  ad?: ReactNode
}) {
  const [when, setWhen] = useState<When>("todos")
  const [day, setDay] = useState<string | null>(null)
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [allMonths, setAllMonths] = useState(false)
  const likeIds = useMemo(() => view.events.slice(0, LIKES_MAX).map((e) => e.id), [view])
  const { likes, onLike, overlays } = useEventLikes(likeIds)

  const match = useMemo(() => {
    const ranges: Record<Exclude<When, "todos" | "gratis">, [string, string]> = { hoy: [view.today, view.today], manana: [view.tomorrow, view.tomorrow], finde: [view.weekend.from, view.weekend.to], mes: [view.today, view.monthEnd] }
    return (w: When) => (e: CarteleraEvent) => (w === "todos" ? true : w === "gratis" ? e.free : inDays(e, ...ranges[w]))
  }, [view])

  const whens: { key: When; label: string; short: string }[] = [
    { key: "todos", label: allLabel, short: "Todos" },
    { key: "hoy", label: "Hoy", short: "Hoy" },
    { key: "manana", label: "Mañana", short: "Mañana" },
    { key: "finde", label: "Este fin de semana", short: "Finde" },
    { key: "mes", label: "Este mes", short: "Este mes" },
    { key: "gratis", label: "Gratis", short: "Gratis" },
  ]
  const filtering = !!day || when !== "todos"
  const groups = useMemo(() => {
    const list = day ? view.events.filter((e) => inDays(e, day, day)) : view.events.filter(match(when))
    // Con un día o un rango elegido, lo que ya empezó se muestra dentro de ese día (no en «hoy»).
    const from = day ?? (when === "manana" ? view.tomorrow : when === "finde" ? view.weekend.from : null)
    return groupCartelera(from ? list.map((e) => (e.date < from ? { ...e, date: from } : e)) : list, view.today)
  }, [view, day, when, match])
  // Sin filtro: los días, lo que queda del mes y el mes siguiente; los demás meses, tras «Cargar los meses siguientes».
  const firstMonth = groups.findIndex((g) => g.big)
  const visible = filtering || allMonths || firstMonth < 0 ? groups : groups.slice(0, firstMonth + 1)
  const pick = (w: When) => { setWhen(w); setDay(null) }
  const spot = spotlight ? view.spotlight : null

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[19.5rem_minmax(0,1fr)] lg:items-start lg:gap-x-8">
      {/* Móvil: los filtros van sueltos entre el destacado y las boletas (la barra de «cuándo» se queda arriba al bajar). Escritorio: columna lateral fija. */}
      <aside className="contents lg:sticky lg:top-4 lg:flex lg:max-h-[calc(100dvh-2rem)] lg:flex-col lg:gap-4 lg:overflow-y-auto lg:[scrollbar-width:none]">
        <div role="group" aria-label="Cuándo" className={cn("sticky top-0 z-20 order-3 -mx-4 flex gap-2 overflow-x-auto bg-background px-4 py-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:static lg:order-none lg:mx-0 lg:shrink-0 lg:flex-col lg:gap-0 lg:overflow-visible", PANEL)}>
          <p className={PANEL_TITLE}>Cuándo</p>
          {whens.map((w) => {
            const on = !day && when === w.key
            return (
              <button key={w.key} type="button" aria-pressed={on} onClick={() => pick(w.key)}
                className={cn("flex min-h-11 shrink-0 items-center justify-between gap-2 rounded-full border-[1.5px] px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 lg:rounded-xl lg:border-0 lg:px-3", on ? "border-primary-dark bg-primary-dark text-white" : "border-border bg-card hover:bg-muted")}>
                <span className="lg:hidden">{w.short}</span><span className="hidden lg:inline">{w.label}</span>
                <span className={cn("text-[0.8125rem]", on ? "text-brand-gold" : "text-primary-dark")}>{view.events.filter(match(w.key)).length}</span>
              </button>
            )
          })}
        </div>

        <div className="order-5 rounded-3xl border border-border bg-card p-3 pt-3.5 lg:order-none lg:shrink-0">
          <p className="mb-1.5 px-1 font-heading text-[1.0625rem] font-bold">Próximos 14 días</p>
          <div className="grid grid-cols-7 gap-1">
            {view.calendar.map((d) => {
              const on = day === d.date
              return (
                <button key={d.date} type="button" disabled={!d.count} aria-pressed={on} aria-label={`${d.wd} ${d.day}: ${d.count} ${d.count === 1 ? "evento" : "eventos"}`}
                  onClick={() => { setDay(on ? null : d.date); setWhen("todos") }}
                  className={cn("flex min-h-15 flex-col items-center gap-0.5 rounded-xl pt-1.5 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50", on ? "bg-primary-dark text-white" : d.count ? "hover:bg-muted" : "text-muted-foreground/70")}>
                  <span className="text-xs font-medium">{d.wd}</span>
                  <span className="font-heading text-base font-bold leading-none">{d.day}</span>
                  <span className={cn("grid h-4 min-w-4.5 place-items-center rounded-full px-1 text-xs font-semibold text-wine", d.count ? "bg-brand-gold" : "")}>{d.count || ""}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 px-1 text-[0.8125rem] text-muted-foreground">Toca un día para ver solo sus eventos.</p>
        </div>

        {cats.length ? (
          <div className={cn("order-4 lg:order-none lg:shrink-0", PANEL)}>
            <p className={PANEL_TITLE}>{catsTitle}</p>
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
              {cats.map((c) => (
                <li key={c.href} className="shrink-0"><Link href={c.href} aria-current={c.current ? "page" : undefined} className={cn("flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50", c.current ? "bg-primary-dark text-white" : "bg-accent text-wine hover:bg-brand-gold/40")}>{c.label}<span className="font-semibold">{c.count}</span></Link></li>
              ))}
            </ul>
          </div>
        ) : null}
        {ad ? <div className="order-7 lg:order-none lg:shrink-0">{ad}</div> : null}
      </aside>

      {/* En móvil sus partes se intercalan con los filtros (por eso `contents`); en escritorio es la columna principal. */}
      <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-8">
        {spot ? <Spotlight key={spot.id} spot={spot} liked={likes[spot.id] ?? false} onLike={onLike} /> : null}
        {featured ? <div className="order-2 min-w-0 lg:order-none">{featured}</div> : null}

        <div className="order-6 min-w-0 lg:order-none">
          {visible.length ? (
            <div className="flex flex-col gap-6 sm:gap-7">
              {visible.map((g) => {
                const all = open.has(g.key) || g.items.length <= PER_GROUP
                return (
                  <section key={g.key} aria-labelledby={`dia-${g.key}`}>
                    <div className="mb-2.5 flex items-baseline justify-between gap-3 sm:justify-start sm:gap-3.5">
                      <h2 id={`dia-${g.key}`} className={cn("font-heading font-bold leading-tight", g.big ? "text-[1.75rem] sm:text-[2.125rem]" : "text-[1.375rem] sm:text-[1.625rem]")}>{g.title}</h2>
                      <span className="shrink-0 text-[0.8125rem] font-semibold text-primary-dark sm:text-sm">{g.items.length} {g.items.length === 1 ? "evento" : "eventos"}</span>
                    </div>
                    <ul className="grid gap-2.5 sm:gap-3.5 md:grid-cols-[repeat(auto-fill,minmax(25rem,1fr))]">
                      {(all ? g.items : g.items.slice(0, PER_GROUP)).map((e) => <Ticket key={e.id} e={e} i={e.id.charCodeAt(0) + e.id.charCodeAt(e.id.length - 1)} byDay={g.byDay} liked={likes[e.id] ?? false} onLike={onLike} />)}
                    </ul>
                    {all ? null : (
                      <button type="button" onClick={() => setOpen((s) => new Set(s).add(g.key))} className="mt-3 flex min-h-11.5 w-full items-center justify-center rounded-2xl border-[1.5px] border-dashed border-primary-dark bg-card text-sm font-semibold text-primary-dark outline-none transition-colors hover:bg-primary-light focus-visible:ring-3 focus-visible:ring-ring/50">Ver los {g.items.length} {g.of}</button>
                    )}
                  </section>
                )
              })}
              {visible.length < groups.length ? (
                <button type="button" onClick={() => setAllMonths(true)} className="mx-auto flex min-h-12 w-full max-w-80 items-center justify-center rounded-full border-[1.5px] border-primary-dark text-[0.9375rem] font-semibold text-primary-dark outline-none transition-colors hover:bg-primary-light focus-visible:ring-3 focus-visible:ring-ring/50">Cargar los meses siguientes</button>
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
      {overlays}
    </div>
  )
}
