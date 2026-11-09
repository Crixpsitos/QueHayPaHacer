import { FEW_DATA_BELOW, type StatsTotals } from "./fichaStats"
import { AUTO_CHANNELS } from "@/domain/entities/links/autoLinks"
import type { Channel } from "./trafficSource"

/** `n` días consecutivos que terminan en `endDay` (`YYYY-MM-DD`, día de Bogotá), del más viejo al más nuevo. */
export function dayRange(endDay: string, n: number): string[] {
  const end = new Date(`${endDay}T00:00:00Z`).getTime()
  return Array.from({ length: n }, (_, i) => new Date(end - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10))
}

export interface SeriesPoint { day: string; views: number }
/** Serie de visitas por día sobre `days` (los días sin doc valen 0) y el día pico (null si no hubo visitas). */
export function buildSeries(docs: { day?: string; views?: number }[], days: string[]) {
  const byDay = new Map(docs.map((d) => [d.day, typeof d.views === "number" && d.views > 0 ? d.views : 0]))
  const points: SeriesPoint[] = days.map((day) => ({ day, views: byDay.get(day) ?? 0 }))
  const top = points.reduce((a, p) => (p.views > a.views ? p : a), { day: "", views: 0 })
  return { points, peak: top.views > 0 ? top : null }
}

const sum = (t: StatsTotals, keys: readonly string[]) => keys.reduce((n, k) => n + (t.byType[k] ?? 0), 0)
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0)

/** Del vistazo (visitas) al interés (compartir, mapa, transporte) y la acción (registro, reserva, WhatsApp, web, redes, llamar). */
export function buildFunnel(t: StatsTotals) {
  const interest = sum(t, ["share", "directions", "transit"])
  const action = sum(t, ["register_external", "booking", "whatsapp", "website", "social", "call"])
  return { views: t.views, interest, action, interestPct: pct(interest, t.views), actionPct: pct(action, t.views) }
}

export type VerdictLevel = "few" | "good" | "ok" | "low"
const LABEL: Record<VerdictLevel, string> = { few: "Pocos datos", good: "Va bien", ok: "Va normal", low: "Puede mejorar" }

/**
 * Veredicto con bandas FIJAS sobre el % de visitas que llegan a una acción (≥5 bien, ≥2 normal, <2 mejorar). Bajo
 * `FEW_DATA_BELOW` visitas no opina. NO compara con otros eventos (eso exige ≥5 pares y llega después).
 */
export function buildVerdict(i: { views: number; actionPct: number }) {
  if (i.views < FEW_DATA_BELOW) {
    return { level: "few" as const, label: LABEL.few, headline: "Aún hay pocos datos para opinar.", detail: `Con ${i.views} ${i.views === 1 ? "visita" : "visitas"} todavía no se puede saber si funciona. Vuelve cuando pasen de ${FEW_DATA_BELOW}.` }
  }
  const level: VerdictLevel = i.actionPct >= 5 ? "good" : i.actionPct >= 2 ? "ok" : "low"
  const n = Math.round(i.actionPct)
  return {
    level,
    label: LABEL[level],
    headline: `De cada 100 personas que ven esta ficha, ${n} hacen clic en una acción (comprar, reservar, escribir).`,
    detail: `Basado en ${i.views.toLocaleString("es-CO")} visitas.`,
  }
}

export interface ChannelRow { id: Channel; label: string; visits: number; actions: number; linkClicks: number }
/** Una fila por canal automático: visitas (solo vistas), acciones (lo demás de ese origen) y clics en el enlace. */
export function channelRows(t: StatsTotals): ChannelRow[] {
  return AUTO_CHANNELS.map(({ id, label }) => {
    const visits = t.viewsBy[`ch_${id}`] ?? 0
    return { id, label, visits, actions: Math.max((t.bySource[`ch_${id}`] ?? 0) - visits, 0), linkClicks: t.linkClicks[id] ?? 0 }
  })
}

/** Un consejo concreto con los datos que hay, o null. No aconseja con pocos datos. */
export function nextStep(t: StatsTotals): { channel: Channel | null; title: string; body: string } | null {
  if (t.views < FEW_DATA_BELOW) return null
  const used = (id: string) => (t.viewsBy[`ch_${id}`] ?? 0) + (t.linkClicks[id] ?? 0) > 0
  const any = AUTO_CHANNELS.some((c) => used(c.id))
  if (!any) return { channel: null, title: "Aún no usas tus enlaces por canal.", body: "Copia uno, pégalo donde publicas y aquí verás cuánta gente trae cada uno." }
  if (used("ig") && !used("ig_h")) return { channel: "ig_h", title: "Tu Instagram funciona, pero aún no usas el enlace de historias.", body: "Pégalo en tu próxima historia: ahí mucha gente toca el enlace." }
  return null
}
