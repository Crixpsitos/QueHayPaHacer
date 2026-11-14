import { bogotaDateIso } from "@/domain/entities/activities/value-objects/occurrences"
import { whenRange } from "@/domain/entities/activities/when"
import { addDays } from "@/domain/entities/home/moments"
import { clock, clockText } from "@/presentation/home/lib/buildHomeView"

/** Evento ya reducido a datos simples (se cachea y viaja al navegador). */
export interface CarteleraIn { id: string; slug: string; title: string; startsAt: number; endsAt: number; venue: string; price: string; free: boolean; coverUrl: string | null; category: string; /** «Varias fechas» si tiene varias funciones; vacío si es una sola. */ multi: string; /** Lugar y dirección. */ place: string; /** «Inscripción abierta · Quedan 8 cupos». */ info: string; /** Personas que marcaron «Voy a ir». */ going: number; views: number; /** «3 precios» si hay varias categorías de precio. */ tiers: string }
export interface CarteleraEvent { id: string; href: string; title: string; venue: string; cover: string | null; price: string; free: boolean; category: string; multi: string; place: string; info: string; going: number; views: number; tiers: string; /** Día en que se muestra (hoy si ya empezó y sigue). */ date: string; endDate: string; time: string; ampm: string; wd: string; day: string; mon: string }
export interface CarteleraView {
  today: string
  tomorrow: string
  weekend: { from: string; to: string }
  monthEnd: string
  total: number
  /** «El próximo es hoy a las 7:00 pm». Vacío si no hay eventos. */
  nextLabel: string
  spotlight: (CarteleraEvent & { badge: string }) | null
  events: CarteleraEvent[]
  /** Hoy y los 13 días siguientes, con cuántos eventos hay cada día. */
  calendar: { date: string; wd: string; day: string; count: number }[]
}
export interface CarteleraGroup { key: string; title: string; /** «Ver los 6 de hoy», «…del sábado», «…de diciembre»: cómo termina el botón que abre el resto. */ of: string; /** Los meses van con título más grande. */ big: boolean; /** Día suelto: la boleta muestra la hora; si no, la fecha. */ byDay: boolean; items: CarteleraEvent[] }

const TZ = "America/Bogota"
const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-CO", { timeZone: TZ, ...o })
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const noon = (iso: string) => Date.parse(`${iso}T12:00:00-05:00`)
const short = (o: Intl.DateTimeFormatOptions, ms: number) => fmt(o).format(ms).replace(".", "")
const hhmmOf = (ms: number) => new Date(ms - 5 * 3_600_000).toISOString().slice(11, 16)

/** ¿Pasa algo de este evento entre `from` y `to`? */
export const inDays = (e: Pick<CarteleraEvent, "date" | "endDate">, from: string, to: string) => e.date <= to && e.endDate >= from

export function buildCartelera(input: CarteleraIn[], now: Date): CarteleraView {
  const today = bogotaDateIso(now)
  const events = input
    .filter((e) => e.endsAt >= now.getTime())
    .sort((a, b) => a.startsAt - b.startsAt)
    .map((e): CarteleraEvent => {
      const start = bogotaDateIso(new Date(e.startsAt))
      const date = start < today ? today : start
      return {
        id: e.id, href: `/eventos/${e.slug || e.id}`, title: e.title, venue: e.venue, cover: e.coverUrl, price: e.price, free: e.free, category: e.category, multi: e.multi, place: e.place || e.venue, info: e.info, going: e.going, views: e.views, tiers: e.tiers,
        date, endDate: bogotaDateIso(new Date(e.endsAt)), ...clock(hhmmOf(e.startsAt)),
        wd: short({ weekday: "short" }, noon(date)), day: fmt({ day: "numeric" }).format(noon(date)), mon: short({ month: "short" }, noon(date)),
      }
    })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)) // estable: dentro del día sigue por hora

  const next = input.filter((e) => e.startsAt >= now.getTime()).sort((a, b) => a.startsAt - b.startsAt)[0]
  const nextDate = next ? bogotaDateIso(new Date(next.startsAt)) : ""
  const first = events[0] ?? null
  const firstIn = first ? input.find((e) => e.id === first.id)! : null
  const tonight = !!firstIn && first!.date === today && firstIn.startsAt >= now.getTime() && Number(hhmmOf(firstIn.startsAt).slice(0, 2)) >= 18
  const [y, m] = today.split("-").map(Number)
  return {
    today, tomorrow: addDays(today, 1), weekend: whenRange("este-fin-de-semana", now),
    monthEnd: new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10),
    total: events.length,
    nextLabel: next ? `El próximo es ${nextDate === today ? "hoy" : `el ${short({ weekday: "long" }, next.startsAt)} ${short({ day: "numeric" }, next.startsAt)}`} a las ${clockText(hhmmOf(next.startsAt))}.` : "",
    spotlight: first ? { ...first, badge: `${tonight ? "Esta noche" : first.date === today ? (firstIn!.startsAt < now.getTime() ? "En curso" : "Hoy") : cap(`${first.wd} ${first.day}`)}${firstIn!.startsAt < now.getTime() ? "" : `, ${first.time} ${first.ampm}`}` } : null,
    events,
    calendar: Array.from({ length: 14 }, (_, i) => {
      const date = addDays(today, i)
      return { date, wd: i === 0 ? "hoy" : short({ weekday: "short" }, noon(date)), day: fmt({ day: "numeric" }).format(noon(date)), count: events.filter((e) => inDays(e, date, date)).length }
    }),
  }
}

/** Boletas agrupadas: un grupo por día (hoy y los 6 siguientes), luego «Más adelante en <mes>» y después un grupo por mes. */
export function groupCartelera(events: CarteleraEvent[], today: string): CarteleraGroup[] {
  const weekEnd = addDays(today, 6)
  const groups = new Map<string, CarteleraGroup>()
  for (const e of events) {
    const d = e.date < today ? today : e.date
    const month = d.slice(0, 7)
    const long = (o: Intl.DateTimeFormatOptions) => fmt(o).format(noon(d))
    const wdDay = `${long({ weekday: "long" })} ${long({ day: "numeric" })}` // «viernes 13» (Intl mete una coma si se piden juntos)
    const g = d <= weekEnd
      ? { key: d, big: false, byDay: true, of: d === today ? "de hoy" : `del ${long({ weekday: "long" })}`, title: d === today ? `Hoy, ${wdDay}` : d === addDays(today, 1) ? `Mañana, ${wdDay}` : cap(wdDay) }
      : month === today.slice(0, 7)
        ? { key: `resto-${month}`, big: false, byDay: false, of: `que quedan de ${long({ month: "long" })}`, title: `Más adelante en ${long({ month: "long" })}` }
        : { key: month, big: true, byDay: false, of: `de ${long({ month: "long" })}`, title: cap(long(month.slice(0, 4) === today.slice(0, 4) ? { month: "long" } : { month: "long", year: "numeric" })) }
    if (!groups.has(g.key)) groups.set(g.key, { ...g, items: [] })
    groups.get(g.key)!.items.push(e)
  }
  return [...groups.values()]
}
