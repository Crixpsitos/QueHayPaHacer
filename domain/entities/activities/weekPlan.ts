import type { ActivitySchedule } from "./value-objects/ActivitySchedule"
import { occurrencesBetween } from "./value-objects/occurrences"

export interface WeekItem { id: string; title: string; schedule: ActivitySchedule }
export interface WeekBlock { id: string; title: string; /** minutos desde medianoche (Bogotá) o null si no tiene hora fija */ startMin: number | null; endMin: number | null; conflictsWith: string[] }
export interface WeekDay { date: string; blocks: WeekBlock[] }

const DEFAULT_MIN = 60
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
const bogotaMinutes = (d: Date) => { const t = new Date(d.getTime() - 5 * 3_600_000); return t.getUTCHours() * 60 + t.getUTCMinutes() }

/**
 * Los próximos 7 días con lo que la persona guardó o reservó: cada plan en su hora, y los que se pisan marcados.
 * Lo que ya terminó hoy no cuenta. Empezar justo cuando otro termina no es cruce.
 */
export function buildWeekPlan(items: readonly WeekItem[], fromDate: string, now: Date): WeekDay[] {
  const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => ({ date: addDays(fromDate, i), blocks: [] }))
  for (const it of items) {
    for (const o of occurrencesBetween(it.schedule, fromDate, days[6].date)) {
      const day = days.find((d) => d.date === o.date)
      if (!day) continue
      if (o.startsAt) {
        const end = o.endsAt ?? new Date(o.startsAt.getTime() + DEFAULT_MIN * 60_000)
        if (end.getTime() <= now.getTime()) continue
        const startMin = bogotaMinutes(o.startsAt)
        day.blocks.push({ id: it.id, title: it.title, startMin, endMin: startMin + Math.max(1, Math.round((end.getTime() - o.startsAt.getTime()) / 60_000)), conflictsWith: [] })
      } else if (!day.blocks.some((b) => b.id === it.id)) day.blocks.push({ id: it.id, title: it.title, startMin: null, endMin: null, conflictsWith: [] })
    }
  }
  for (const d of days) {
    d.blocks.sort((a, b) => (a.startMin ?? 1e9) - (b.startMin ?? 1e9) || a.id.localeCompare(b.id))
    for (const a of d.blocks) for (const b of d.blocks) {
      if (a === b || a.startMin === null || b.startMin === null || a.endMin === null || b.endMin === null) continue
      if (a.startMin < b.endMin && b.startMin < a.endMin) a.conflictsWith.push(b.id)
    }
  }
  return days
}

const hourText = (m: number) => { const h = Math.floor(m / 60), mm = m % 60; return `${h % 12 === 0 ? 12 : h % 12}:${String(mm).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}` }
const dayText = (iso: string) => new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`))

/** Mensaje de WhatsApp con el plan: un renglón por plan, solo los días que tienen algo. */
export function weekPlanText(week: readonly WeekDay[], title: string): string {
  const lines = week.filter((d) => d.blocks.length).flatMap((d) => [`${dayText(d.date)}`, ...d.blocks.map((b) => `• ${b.startMin === null ? "Todo el día" : hourText(b.startMin)} ${b.title}`)])
  return [title, ...lines].join("\n")
}
