import { holdsSpot, type JoinStatusValue } from "@/domain/entities/activities/activityJoin"
import type { JoinRow } from "@/domain/repository/activities/IActivityJoinRepository"

export const MIN_RESERVATIONS_FOR_PERCENT = 10
export type StatusFilter = "all" | JoinStatusValue

export interface DepartureSummary { key: string; taken: number; capacity: number | null }

/** Salidas con reservas, en orden, con cuántas ocupan cupo ("No pagó" no cuenta). */
export function departureSummaries(rows: JoinRow[], capacity: number | null): DepartureSummary[] {
  const taken = new Map<string, number>()
  for (const r of rows) taken.set(r.key, (taken.get(r.key) ?? 0) + (holdsSpot(r.status) ? 1 : 0))
  return [...taken.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, n]) => ({ key, taken: n, capacity }))
}

export interface Funnel { views: number; reserved: number; pending: number; confirmed: number; visits: number; showPercent: boolean; reservePercent: number }

/** Vieron → Reservaron → Por confirmar → Confirmadas → Fueron. Vieron y Fueron son de toda la actividad (no por salida). */
export function funnelFor(rows: JoinRow[], key: string, a: { views: number; visits: number }): Funnel {
  const mine = rows.filter((r) => r.key === key)
  const pending = mine.filter((r) => r.status === "pending").length
  const confirmed = mine.filter((r) => r.status === "confirmed").length
  const reserved = pending + confirmed
  return {
    views: a.views, reserved, pending, confirmed, visits: a.visits,
    showPercent: reserved >= MIN_RESERVATIONS_FOR_PERCENT && a.views > 0,
    reservePercent: a.views > 0 ? Math.round((reserved / a.views) * 100) : 0,
  }
}

export const rowsFor = (rows: JoinRow[], key: string, filter: StatusFilter) =>
  rows.filter((r) => r.key === key && (filter === "all" || r.status === filter)).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

export function whatsappHref(phone: string | null, title: string, dateText: string): string | null {
  if (!phone || !/^3\d{9}$/.test(phone)) return null
  return `https://wa.me/57${phone}?text=${encodeURIComponent(`Hola, te escribo por tu reserva en ${title} (${dateText}).`)}`
}
