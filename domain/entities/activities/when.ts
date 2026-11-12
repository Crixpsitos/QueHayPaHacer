import type { ActivitySchedule } from "./value-objects/ActivitySchedule"
import { bogotaDateIso, occurrencesBetween, type Occurrence } from "./value-objects/occurrences"

/** Filtro "cuándo" de las páginas públicas: sale de la URL (`cuando=`) y se calcula con la fecha civil de Bogotá. */
export const WHEN_VALUES = ["hoy", "este-fin-de-semana", "esta-semana"] as const
export type When = (typeof WHEN_VALUES)[number]
export interface DayRange { from: string; to: string }

export const parseWhen = (v: unknown): When | undefined => (typeof v === "string" && (WHEN_VALUES as readonly string[]).includes(v) ? (v as When) : undefined)

const DAY_MS = 86_400_000
const add = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
const weekdayOf = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay() // 0 = domingo

/** hoy · fin de semana = de viernes a domingo (desde hoy si ya empezó) · semana = hoy y los 6 días siguientes. */
export function whenRange(w: When, now: Date): DayRange {
  const today = bogotaDateIso(now)
  const wd = weekdayOf(today)
  if (w === "hoy") return { from: today, to: today }
  if (w === "esta-semana") return { from: today, to: add(today, 6) }
  const sunday = add(today, (7 - wd) % 7)
  const friday = wd === 0 || wd >= 5 ? today : add(today, 5 - wd)
  return { from: friday, to: sunday }
}

/** Primera salida dentro del rango que aún no terminó (la de hoy ya terminada no cuenta). null = no hay. */
export function firstOccurrenceIn(s: ActivitySchedule, r: DayRange, now: Date): Occurrence | null {
  for (const o of occurrencesBetween(s, r.from, r.to)) {
    const endOfDay = new Date(Date.parse(`${o.date}T00:00:00Z`) + 29 * 3_600_000 - 1) // 23:59:59.999 Bogotá
    const until = o.endsAt ?? o.startsAt ?? endOfDay
    if (until.getTime() >= now.getTime()) return o
  }
  return null
}

/** Día suelto de la URL (`dia=YYYY-MM-DD`): solo hoy y los 13 días siguientes. */
export function parseDay(v: unknown, now: Date): string | undefined {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined
  const today = bogotaDateIso(now)
  return v >= today && v <= add(today, 13) ? v : undefined
}
export const dayRange = (day: string): DayRange => ({ from: day, to: day })

/** Cuántas actividades salen cada uno de los próximos `days` días (hoy cuenta solo lo que no terminó). */
export function countsByDay(schedules: readonly ActivitySchedule[], now: Date, days = 7): { date: string; count: number }[] {
  const today = bogotaDateIso(now)
  return Array.from({ length: days }, (_, i) => {
    const date = add(today, i)
    return { date, count: schedules.filter((s) => firstOccurrenceIn(s, { from: date, to: date }, now) !== null).length }
  })
}
