import type { EventComparisonPoint, InteractivityPoint, OrganizerKpis, TopEvent } from "./Studio"

/** Lo mínimo de un evento del organizador para armar el resumen del Estudio (una sola lectura de sus eventos). */
export interface OverviewEventRow {
  id: string
  title: string
  status: string
  createdAt: Date | null
  endDate: Date | null
  registrationType: string
  views: number
  registrations: number
  likes: number
  shares: number
  score: number
}

export interface OverviewBounds { startOfPreviousMonth: Date; startOfCurrentMonth: Date; startOfNextMonth: Date; now: Date }

const pct = (cur: number, prev: number) => (prev <= 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100)
const byScore = (a: OverviewEventRow, b: OverviewEventRow) => b.score - a.score || a.id.localeCompare(b.id)

/**
 * KPIs, conversión, top e interactividad del resumen, calculados en memoria con los eventos del organizador.
 * Antes eran 7 pipelines (cada uno leía los mismos eventos, ~2,3 unidades de lectura por documento); ahora una sola lectura.
 * Mantiene los criterios de esos pipelines: el mes se mide por `createdAt`; activos = publicados que no terminaron.
 */
export function overviewFromEvents(rows: OverviewEventRow[], b: OverviewBounds): {
  kpis: OrganizerKpis
  viewsVsRegistrations: EventComparisonPoint[]
  topEvents: TopEvent[]
  interactivity: InteractivityPoint[]
} {
  const inWindow = rows.filter((r) => r.createdAt && r.createdAt >= b.startOfPreviousMonth && r.createdAt < b.startOfNextMonth)
  const isCurrent = (r: OverviewEventRow) => (r.createdAt as Date) >= b.startOfCurrentMonth
  const sum = (list: OverviewEventRow[], f: (r: OverviewEventRow) => number) => {
    let cur = 0, prev = 0
    for (const r of list) { if (isCurrent(r)) cur += f(r); else prev += f(r) }
    return { cur, prev }
  }
  const views = sum(inWindow, (r) => r.views)
  const regs = sum(inWindow.filter((r) => r.registrationType !== "none"), (r) => r.registrations)
  const likes = sum(inWindow, (r) => r.likes)
  const published = rows.filter((r) => r.status === "published")
  const activeEvents = published.filter((r) => r.endDate && r.endDate >= b.now).length

  return {
    kpis: {
      totalViews: views.cur, previousMonthViews: views.prev, viewsChangePct: pct(views.cur, views.prev),
      totalRegistrations: regs.cur, previousMonthRegistrations: regs.prev, registrationsChangePct: pct(regs.cur, regs.prev),
      totalLikes: likes.cur, previousMonthLikes: likes.prev, likesChangePct: pct(likes.cur, likes.prev),
      // sin comparativa mensual: no hay histórico de «activos» por mes (la UI la oculta con previous = 0)
      activeEvents, previousMonthActiveEvents: 0, activeEventsChangePct: 0,
    },
    // tope de 10 y luego se quitan los externos (su inscripción ocurre fuera: la «conversión» sería falsa)
    viewsVsRegistrations: [...published]
      .sort((a, c) => c.views - a.views || a.id.localeCompare(c.id))
      .slice(0, 10)
      .filter((r) => r.registrationType !== "external")
      .map((r) => ({ eventId: r.id, eventName: r.title, views: r.views, registrations: r.registrations })),
    topEvents: [...inWindow].sort(byScore).slice(0, 5).map((r) => ({ eventId: r.id, name: r.title, views: r.views, score: r.score })),
    interactivity: inWindow.filter((r) => r.status === "published").sort(byScore).slice(0, 6).map((r) => ({ eventName: r.title, views: r.views, likes: r.likes, shares: r.shares })),
  }
}
