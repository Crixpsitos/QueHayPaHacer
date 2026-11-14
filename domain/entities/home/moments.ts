import { bogotaDateIso } from "@/domain/entities/activities/value-objects/occurrences"
import { whenRange, type DayRange } from "@/domain/entities/activities/when"

/** Los cuatro momentos de las pestañas del Home. Las fechas son civiles de Bogotá (`YYYY-MM-DD`). */
export const MOMENT_KEYS = ["hoy", "manana", "finde", "semana"] as const
export type MomentKey = (typeof MOMENT_KEYS)[number]

export interface Timed { startsAt: number; endsAt: number }

const DAY_MS = 86_400_000
export const addDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
const isoOf = (ms: number) => bogotaDateIso(new Date(ms))

export function momentRanges(now: Date): Record<MomentKey, DayRange> {
  const tomorrow = addDays(bogotaDateIso(now), 1)
  return {
    hoy: whenRange("hoy", now),
    manana: { from: tomorrow, to: tomorrow },
    finde: whenRange("este-fin-de-semana", now),
    semana: whenRange("esta-semana", now),
  }
}

/** ¿Pasa algo de este evento en algún día del rango? (un evento de varios días cuenta en todos). */
export const overlapsRange = (t: Timed, r: DayRange) => isoOf(t.startsAt) <= r.to && isoOf(t.endsAt) >= r.from

export const inRange = <T extends Timed>(items: readonly T[], r: DayRange): T[] =>
  items.filter((i) => overlapsRange(i, r)).sort((a, b) => a.startsAt - b.startsAt)

/** Próximos días con eventos, a partir de mañana (hoy ya está arriba): `days` días como máximo. */
export function upcomingByDay<T extends Timed>(items: readonly T[], now: Date, days = 3): { date: string; items: T[] }[] {
  const start = addDays(bogotaDateIso(now), 1)
  const dates = [...new Set(items.flatMap((i) => [isoOf(i.startsAt)]).filter((d) => d >= start))].sort()
  return dates.slice(0, days).map((date) => ({ date, items: inRange(items, { from: date, to: date }) }))
}

/** Meses siguientes al de hoy con su número de eventos (los del resto del mes actual van primero, desde después del último día mostrado). */
export function monthBuckets(items: readonly Timed[], now: Date, after: string): { month: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const i of items) {
    const d = isoOf(i.startsAt)
    if (d > after) counts.set(d.slice(0, 7), (counts.get(d.slice(0, 7)) ?? 0) + 1)
  }
  return [...counts.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([month, count]) => ({ month, count }))
}

/**
 * Qué se muestra cuando hay pocos eventos: «full» (4+ eventos: principal + filas), «fill» (1 a 3: se completa con actividades y sitios)
 * o «empty» (0: una actividad toma el lugar principal y se muestra el próximo evento aunque sea otro día).
 */
export const momentMode = (eventCount: number): "full" | "fill" | "empty" => (eventCount >= 4 ? "full" : eventCount >= 1 ? "fill" : "empty")
