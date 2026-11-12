import type { ActivitySchedule } from "./value-objects/ActivitySchedule"
import { occurrencesBetween } from "./value-objects/occurrences"
import { whenRange } from "./when"

export const DIGEST_MAX_PER_DAY = 6
export interface DigestEvent { id: string; title: string; start: Date; end: Date; place: string; url: string; imageUrl?: string }
export interface DigestActivity { id: string; title: string; schedule: ActivitySchedule; priceFrom: string; place: string; url: string; imageUrl?: string }
export interface DigestItem { kind: "event" | "activity"; title: string; timeLabel: string; place: string; detail: string; url: string; sortMin: number; imageUrl?: string }
export interface DigestDay { date: string; label: string; items: DigestItem[] }
export interface Digest { title: string; days: DigestDay[] }

const OFFSET = 5 * 3_600_000
const DAY = 86_400_000
const dayStart = (iso: string) => Date.parse(`${iso}T00:00:00Z`) + OFFSET // inicio del día de Bogotá, en UTC
const minutesOf = (d: Date) => { const t = new Date(d.getTime() - OFFSET); return t.getUTCHours() * 60 + t.getUTCMinutes() }
const hourText = (m: number) => { const h = Math.floor(m / 60); return `${h % 12 === 0 ? 12 : h % 12}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}` }
const dayLabel = (iso: string) => new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`))
const datesBetween = (from: string, to: string) => { const out: string[] = []; for (let t = Date.parse(from); t <= Date.parse(to); t += DAY) out.push(new Date(t).toISOString().slice(0, 10)); return out }

/**
 * «Qué hacer este fin de semana en Ibagué» (viernes a domingo) desde eventos y actividades reales: cada día en orden de
 * hora, máximo {@link DIGEST_MAX_PER_DAY}, nada que ya terminó. Las actividades sin hora fija no se listan (no hay qué decir).
 */
export function buildWeekendDigest(events: readonly DigestEvent[], activities: readonly DigestActivity[], now: Date): Digest {
  const range = whenRange("este-fin-de-semana", now)
  const days: DigestDay[] = []
  for (const date of datesBetween(range.from, range.to)) {
    const from = dayStart(date), to = from + DAY - 1
    const items: DigestItem[] = []
    for (const e of events) {
      if (e.end.getTime() < now.getTime() || e.end.getTime() < from || e.start.getTime() > to) continue
      const startsToday = e.start.getTime() >= from
      items.push({ kind: "event", title: e.title, timeLabel: startsToday ? hourText(minutesOf(e.start)) : "Todo el día", place: e.place, detail: "Evento", url: e.url, imageUrl: e.imageUrl, sortMin: startsToday ? minutesOf(e.start) : -1 })
    }
    for (const a of activities) {
      for (const o of occurrencesBetween(a.schedule, date, date)) {
        if (!o.startsAt) continue
        if ((o.endsAt ?? new Date(o.startsAt.getTime() + 3_600_000)).getTime() < now.getTime()) continue
        const m = minutesOf(o.startsAt)
        items.push({ kind: "activity", title: a.title, timeLabel: hourText(m), place: a.place, detail: a.priceFrom, url: a.url, imageUrl: a.imageUrl, sortMin: m })
        break
      }
    }
    items.sort((x, y) => x.sortMin - y.sortMin || x.title.localeCompare(y.title, "es"))
    if (items.length) days.push({ date, label: dayLabel(date), items: items.slice(0, DIGEST_MAX_PER_DAY) })
  }
  return { title: "Qué hacer este fin de semana en Ibagué", days }
}

/** Texto listo para pegar en el Canal de WhatsApp: un bloque por día, un renglón por plan y su enlace. */
export function digestText(d: Digest, siteUrl: string): string {
  const body = d.days.flatMap((day) => ["", day.label.charAt(0).toUpperCase() + day.label.slice(1), ...day.items.map((i) => `${i.timeLabel} ${i.title}${i.place ? ` · ${i.place}` : ""}${i.detail && i.kind === "activity" ? ` · ${i.detail}` : ""}\n${siteUrl}${i.url}`)])
  return [d.title, ...body].join("\n")
}
