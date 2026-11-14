import { bogotaDateIso } from "@/domain/entities/activities/value-objects/occurrences"
import { farLabel } from "@/domain/entities/escapadas/Escapada"
import { MOMENT_KEYS, addDays, inRange, momentMode, momentRanges, monthBuckets, upcomingByDay, type MomentKey } from "@/domain/entities/home/moments"

/** Lo que el servidor lee y entrega ya reducido a datos simples (se cachea; nada de clases ni fechas). */
export interface EventIn { id: string; slug: string; title: string; startsAt: number; endsAt: number; venue: string; price: string; coverUrl: string | null; siteId: string | null }
export interface ActivityIn { id: string; slug: string; title: string; place: string; price: string; coverUrl: string | null; occ: Partial<Record<MomentKey, { date: string; hhmm: string | null }>> }
export interface SiteIn { id: string; slug: string; name: string; kind: string; coverUrl: string | null; isOpen: boolean; /** "21:00" si hoy cierra, "17:00" si hoy abre más tarde. */ at: string | null; /** Para la tarjeta completa del carril (todo opcional: las filas del momento no lo usan). */ address?: string; /** "Hoy 10:00 am – 9:00 pm" */ hours?: string; likes?: number; eventCount?: number; photos?: number }

export interface EscapadaIn { id: string; name: string; minutesAway: number; coverUrl: string | null; plans: { title: string; href: string; startsAt: number; endsAt: number }[] }

export interface RowView { kind: "Evento" | "Actividad" | "Sitio"; key: string; href: string; title: string; place: string; price: string | null; cover: string | null; pre: string; time: string; ampm: string }
export interface LeadView { kind: "Evento" | "Actividad"; href: string; title: string; meta: string; cover: string | null; wd: string; day: string; mon: string; badge: string }
export interface MomentView {
  key: MomentKey
  label: string
  /** Etiqueta larga de las pantallas grandes («Este fin de semana»). */
  longLabel: string
  /** Eventos + actividades del momento (el número de la pestaña). */
  count: number
  summary: string
  lead: LeadView | null
  rows: RowView[]
  moreLabel: string
  moreHref: string
}
export interface UpcomingView {
  days: { date: string; wd: string; day: string; mon: string; items: { key: string; href: string; title: string; meta: string }[]; more: string | null }[]
  months: { label: string; count: number }[]
  total: number
}
export interface SiteTodayView { id: string; href: string; name: string; kind: string; cover: string | null; open: string; live: string | null; address: string; hours: string | null; likes: number; eventCount: number; photos: number }
export interface EscapadaView { id: string; /** Lleva al próximo plan del pueblo (no hay página por pueblo todavía). */ href: string; name: string; far: string; plans: string; next: string; cover: string | null }
export interface HomeView { dateLabel: string; /** Próximos eventos (los que no han terminado), del más cercano al más lejano: van en tarjetas completas. */ upcomingIds: string[]; escapadas: EscapadaView[]; /** Sitios abiertos ahora (el carril muestra los primeros 8). */ sitesOpenCount: number; moments: MomentView[]; upcoming: UpcomingView; sites: SiteTodayView[]; activitiesTitle: string; activities: { key: string; href: string; time: string; title: string; meta: string }[] }

const TZ = "America/Bogota"
const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-CO", { timeZone: TZ, ...opts })
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const dayParts = (ms: number) => ({ wd: fmt({ weekday: "short" }).format(ms).replace(".", ""), day: fmt({ day: "numeric" }).format(ms), mon: fmt({ month: "short" }).format(ms).replace(".", "") })
const dateMs = (iso: string) => Date.parse(`${iso}T12:00:00-05:00`)

/** "19:00" → { time: "7:00", ampm: "pm" } */
export function clock(hhmm: string): { time: string; ampm: string } {
  const [h, m] = hhmm.split(":").map(Number)
  return { time: `${h % 12 || 12}:${String(m).padStart(2, "0")}`, ampm: h >= 12 ? "pm" : "am" }
}
const hhmmOfMs = (ms: number) => new Date(ms - 5 * 3_600_000).toISOString().slice(11, 16)
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const join = (parts: string[]) => (parts.length > 1 ? `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}` : (parts[0] ?? ""))

const LABELS: Record<MomentKey, string> = { hoy: "Hoy", manana: "Mañana", finde: "Finde", semana: "Semana" }
const LONG_LABELS: Record<MomentKey, string> = { hoy: "Hoy", manana: "Mañana", finde: "Este fin de semana", semana: "Esta semana" }
const WORDS: Record<MomentKey, string> = { hoy: "hoy", manana: "mañana", finde: "este fin de semana", semana: "esta semana" }
const MORE_HREF: Record<MomentKey, string> = { hoy: "/que-hay-hoy-ibague", manana: "/eventos", finde: "/eventos-este-fin-de-semana-ibague", semana: "/eventos" }

const eventHref = (e: { slug: string; id: string }) => `/eventos/${e.slug || e.id}`
const preOf = (date: string, today: string) => (date === today ? "Hoy" : cap(fmt({ weekday: "short" }).format(dateMs(date)).replace(".", "")))

export function buildHomeView(input: { events: EventIn[]; activities: ActivityIn[]; sites: SiteIn[]; escapadas?: EscapadaIn[]; now: Date }): HomeView {
  const { events, activities, sites, escapadas = [], now } = input
  const today = bogotaDateIso(now)
  const ranges = momentRanges(now)

  const moments = MOMENT_KEYS.map((key): MomentView => {
    const range = ranges[key]
    const evs = inRange(events, range)
    const acts = activities.filter((a) => a.occ[key]).sort((a, b) => (a.occ[key]!.hhmm ?? "99").localeCompare(b.occ[key]!.hhmm ?? "99"))
    const mode = momentMode(evs.length)

    const eventRow = (e: EventIn): RowView => {
      const start = bogotaDateIso(new Date(e.startsAt))
      const date = start < range.from ? range.from : start
      return { kind: "Evento", key: `e-${e.id}`, href: eventHref(e), title: e.title, place: e.venue, price: e.price, cover: e.coverUrl, pre: preOf(date, today), ...clock(hhmmOfMs(e.startsAt)) }
    }
    const actRow = (a: ActivityIn): RowView => {
      const o = a.occ[key]!
      return { kind: "Actividad", key: `a-${a.id}`, href: `/actividades/${a.slug}`, title: a.title, place: a.place, price: a.price, cover: a.coverUrl, pre: preOf(o.date, today), ...(o.hhmm ? clock(o.hhmm) : { time: "Todo", ampm: "el día" }) }
    }
    const siteRow = (s: SiteIn): RowView => ({ kind: "Sitio", key: `s-${s.id}`, href: `/donde-ir/${s.slug}`, title: s.name, place: s.kind, price: null, cover: s.coverUrl, pre: s.isOpen ? "Hasta" : "Abre", ...(s.at ? clock(s.at) : { time: "", ampm: "" }) })

    let lead: LeadView | null = null
    let rows: RowView[] = []
    const sitesOpen = sites.filter((s) => s.isOpen || s.at)

    if (mode !== "empty") {
      // 4 filas siempre: primero los eventos; si faltan, se completa con actividades y luego sitios (la fila dice qué es)
      const [first, ...rest] = evs
      lead = eventLead(first, today)
      rows = [...rest.map(eventRow), ...acts.map(actRow), ...sitesOpen.map(siteRow)].slice(0, 4)
    } else {
      const a0 = acts[0]
      if (a0) lead = actLead(a0, key, today)
      const next = events.filter((e) => e.endsAt >= now.getTime()).sort((a, b) => a.startsAt - b.startsAt)[0]
      rows = [...(next ? [{ ...eventRow(next), pre: preOf(bogotaDateIso(new Date(next.startsAt)), today) }] : []), ...acts.slice(1).map(actRow), ...sitesOpen.map(siteRow)].slice(0, 4)
    }

    const parts = [evs.length ? plural(evs.length, "evento", "eventos") : "", acts.length ? plural(acts.length, "actividad", "actividades") : "", key === "hoy" && sitesOpen.length ? `${plural(sites.filter((s) => s.isOpen).length, "sitio abierto", "sitios abiertos")} ahora` : ""].filter(Boolean)
    return {
      key, label: LABELS[key], longLabel: LONG_LABELS[key], count: evs.length + acts.length,
      summary: parts.length ? join(parts) : "Todavía no hay planes publicados para este momento",
      lead, rows,
      moreLabel: evs.length === 0 ? "Ver los próximos eventos" : key === "hoy" ? `Ver los ${evs.length} de hoy` : key === "manana" ? "Ver todo lo de mañana" : key === "finde" ? `Ver los ${evs.length} del fin de semana` : `Ver los ${evs.length} de la semana`,
      moreHref: evs.length === 0 ? "/eventos" : MORE_HREF[key],
    }
  })

  const upcomingDays = upcomingByDay(events, now, 3)
  const lastShown = upcomingDays.length ? upcomingDays[upcomingDays.length - 1].date : addDays(today, 1)
  const upcoming: UpcomingView = {
    days: upcomingDays.map((d) => {
      const p = dayParts(dateMs(d.date))
      return {
        date: d.date, ...p,
        items: d.items.slice(0, 2).map((e) => ({ key: e.id, href: eventHref(e), title: e.title, meta: [clockText(hhmmOfMs(e.startsAt)), e.venue, e.price].filter(Boolean).join(" · ") })),
        more: d.items.length > 2 ? `y ${d.items.length - 2} más el ${fmt({ weekday: "long" }).format(dateMs(d.date))}` : null,
      }
    }),
    months: monthBuckets(events, now, lastShown).map((m) => ({ label: cap(fmt({ month: "long" }).format(dateMs(`${m.month}-15`))), count: m.count })),
    total: events.filter((e) => e.endsAt >= now.getTime()).length,
  }

  const siteLive = new Map<string, string>()
  for (const e of [...events].sort((a, b) => a.startsAt - b.startsAt)) {
    if (!e.siteId || siteLive.has(e.siteId) || e.endsAt < now.getTime() || bogotaDateIso(new Date(e.startsAt)) > ranges.semana.to) continue
    const date = bogotaDateIso(new Date(e.startsAt))
    siteLive.set(e.siteId, `${date === today ? "Hoy" : cap(fmt({ weekday: "short", day: "numeric" }).format(e.startsAt).replace(".", ""))} ${clockText(hhmmOfMs(e.startsAt))}: ${e.title}`)
  }
  const sitesView = sites
    .filter((s) => s.isOpen || s.at)
    .sort((a, b) => Number(siteLive.has(b.id)) - Number(siteLive.has(a.id)) || Number(b.isOpen) - Number(a.isOpen))
    .slice(0, 8)
    .map((s): SiteTodayView => ({ id: s.id, href: `/donde-ir/${s.slug}`, name: s.name, kind: s.kind, cover: s.coverUrl, open: s.isOpen ? (s.at ? `Abierto hasta las ${clockText(s.at)}` : "Abierto ahora") : `Abre a las ${clockText(s.at!)}`, live: siteLive.get(s.id) ?? null, address: s.address ?? "", hours: s.hours ?? null, likes: s.likes ?? 0, eventCount: s.eventCount ?? 0, photos: s.photos ?? 0 }))

  const todayActs = activities.filter((a) => a.occ.hoy)
  const actList = (todayActs.length ? todayActs : activities.filter((a) => a.occ.semana)).slice(0, 5)
  const actKey: MomentKey = todayActs.length ? "hoy" : "semana"
  return {
    dateLabel: cap(fmt({ weekday: "long", day: "numeric", month: "long" }).format(now)),
    moments, upcoming, sites: sitesView, sitesOpenCount: sites.filter((s) => s.isOpen).length,
    upcomingIds: events.filter((e) => e.endsAt >= now.getTime()).sort((a, b) => a.startsAt - b.startsAt).slice(0, 8).map((e) => e.id),
    escapadas: escapadas.flatMap((x): EscapadaView[] => {
      const plans = x.plans.filter((p) => p.endsAt >= now.getTime()).sort((a, b) => a.startsAt - b.startsAt)
      if (!plans.length) return [] // un pueblo sin planes próximos no se dibuja
      const n = plans[0]
      const when = bogotaDateIso(new Date(n.startsAt)) === today ? "Hoy" : cap(fmt({ weekday: "short", day: "numeric" }).format(n.startsAt).replace(".", ""))
      return [{ id: x.id, href: n.href, name: x.name, far: farLabel(x.minutesAway), plans: plural(plans.length, "plan", "planes"), next: `${when}: ${n.title}`, cover: x.coverUrl }]
    }),
    activitiesTitle: todayActs.length ? "Actividades de hoy" : "Actividades de esta semana",
    activities: actList.sort((a, b) => (a.occ[actKey]!.hhmm ?? "99").localeCompare(b.occ[actKey]!.hhmm ?? "99")).map((a) => ({ key: a.id, href: `/actividades/${a.slug}`, time: a.occ[actKey]!.hhmm ? clockText(a.occ[actKey]!.hhmm!) : "Todo el día", title: a.title, meta: [a.place, a.price].filter(Boolean).join(" · ") })),
  }
}

/** «Hoy, 7:00 pm» o «Sáb 14»: cuándo es, para los afiches destacados. */
export function whenLabel(startsAt: number, now: Date): string {
  const hhmm = hhmmOfMs(startsAt)
  if (bogotaDateIso(new Date(startsAt)) === bogotaDateIso(now)) return `Hoy, ${clockText(hhmm)}`
  return cap(fmt({ weekday: "short", day: "numeric" }).format(startsAt).replace(".", ""))
}

export const clockText = (hhmm: string) => { const c = clock(hhmm); return `${c.time} ${c.ampm}` }

function eventLead(e: EventIn, today: string): LeadView {
  const date = bogotaDateIso(new Date(e.startsAt))
  const p = dayParts(e.startsAt)
  const when = date === today ? "Hoy" : `${cap(fmt({ weekday: "short" }).format(e.startsAt).replace(".", ""))} ${p.day}`
  return { kind: "Evento", href: eventHref(e), title: e.title, meta: [clockText(hhmmOfMs(e.startsAt)), e.venue, e.price].filter(Boolean).join(" · "), cover: e.coverUrl, ...p, badge: `${when}, ${clockText(hhmmOfMs(e.startsAt))}` }
}

function actLead(a: ActivityIn, key: MomentKey, today: string): LeadView {
  const o = a.occ[key]!
  const p = dayParts(dateMs(o.date))
  return { kind: "Actividad", href: `/actividades/${a.slug}`, title: a.title, meta: [a.place, a.price].filter(Boolean).join(" · "), cover: a.coverUrl, ...p, badge: `${preOf(o.date, today)}${o.hhmm ? `, ${clockText(o.hhmm)}` : ""}` }
}
