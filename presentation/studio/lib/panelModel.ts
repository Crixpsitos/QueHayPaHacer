import { FEW_DATA_BELOW, sourceShares, sumStats, type DailyStatsDoc, type SourceShare, type StatsTotals } from "@/domain/entities/analytics/fichaStats"
import { buildFunnel, buildSeries, buildVerdict, channelRows, dayRange, nextStep, type ChannelRow, type SeriesPoint } from "@/domain/entities/analytics/panel"
import type { Channel } from "@/domain/entities/analytics/trafficSource"
import type { FichaRef, LinkRow } from "./panelTypes"

import type { FichaType, Period, TypeFilter } from "./panelNav"
export { PERIODS, type Period } from "./panelNav"

export interface PanelFicha { key: string; type: FichaType; id: string; name: string; image?: string; views30: number; selected: boolean }
export interface PanelDetail {
  type: FichaType; id: string; name: string; image?: string; publicHref: string
  verdict: ReturnType<typeof buildVerdict>
  kpis: { views: number; interest: number; action: number; interestPct: number; actionPct: number; viewsDeltaPct: number | null }
  series: { points: SeriesPoint[]; peak: SeriesPoint | null }
  sources: SourceShare[]
  channels: ChannelRow[]
  next: { channel: Channel | null; title: string; body: string } | null
  customLinks: LinkRow[]
}
export interface PanelVM { fichas: PanelFicha[]; period: Period; typeFilter: TypeFilter; counts: { all: number; event: number; site: number; activity: number }; detail: PanelDetail | null }

interface Input {
  fichas: FichaRef[]
  /** Estadísticas de 30 días por ficha (`tipo:id`): solo para las miniaturas. */
  stats30: Record<string, StatsTotals>
  selectedKey: string | null
  period: Period
  /** Filtro por tipo (por defecto, todos). */
  typeFilter?: TypeFilter
  /** Día de hoy en Bogotá (`YYYY-MM-DD`). */
  today: string
  /** Docs diarios de la ficha seleccionada de los últimos 2×período días (actual + anterior). */
  docs: DailyStatsDoc[]
  links: LinkRow[]
}

const prevDay = (day: string) => new Date(new Date(`${day}T00:00:00Z`).getTime() - 86_400_000).toISOString().slice(0, 10)

/** Une todo en el modelo que pinta el panel. Sin I/O: el servidor le pasa lo ya leído. */
export function buildPanel(i: Input): PanelVM {
  const keyOf = (f: FichaRef) => `${f.type}:${f.id}`
  const views30 = (f: FichaRef) => i.stats30[keyOf(f)]?.views ?? 0
  const typeFilter = i.typeFilter ?? "all"
  const counts = { all: i.fichas.length, event: i.fichas.filter((f) => f.type === "event").length, site: i.fichas.filter((f) => f.type === "site").length, activity: i.fichas.filter((f) => f.type === "activity").length }
  // `fichas` lleva TODAS (el cliente filtra por tipo al instante); la seleccionada sale del tipo filtrado.
  const sorted = [...i.fichas].sort((a, b) => views30(b) - views30(a))
  const pool = sorted.filter((f) => typeFilter === "all" || f.type === typeFilter)
  const selected = pool.find((f) => keyOf(f) === i.selectedKey) ?? pool[0] ?? null
  const fichas: PanelFicha[] = sorted.map((f) => ({ key: keyOf(f), type: f.type, id: f.id, name: f.name, image: f.image, views30: views30(f), selected: f === selected }))
  if (!selected) return { fichas, period: i.period, typeFilter, counts, detail: null }

  const curDays = dayRange(i.today, i.period)
  const prevDays = dayRange(prevDay(curDays[0]), i.period)
  const inDays = (days: string[]) => i.docs.filter((d) => d.day !== undefined && days.includes(d.day))
  const cur = sumStats(inDays(curDays))
  const prev = sumStats(inDays(prevDays))
  const funnel = buildFunnel(cur)
  return {
    fichas,
    period: i.period,
    typeFilter,
    counts,
    detail: {
      type: selected.type,
      id: selected.id,
      name: selected.name,
      image: selected.image,
      publicHref: selected.type === "event" ? `/eventos/${selected.id}` : selected.type === "activity" ? `/actividades/${selected.slug || selected.id}` : `/donde-ir/${selected.id}`,
      verdict: buildVerdict({ views: cur.views, actionPct: funnel.actionPct }),
      kpis: {
        views: cur.views, interest: funnel.interest, action: funnel.action, interestPct: funnel.interestPct, actionPct: funnel.actionPct,
        // la comparación solo se ofrece si el período anterior tiene visitas suficientes para que el % signifique algo
        viewsDeltaPct: prev.views >= FEW_DATA_BELOW ? Math.round(((cur.views - prev.views) / prev.views) * 100) : null,
      },
      series: buildSeries(inDays(curDays), curDays),
      sources: sourceShares(cur.viewsBy),
      channels: channelRows(cur),
      next: nextStep(cur),
      customLinks: i.links.filter((l) => l.targetType === selected.type && l.targetId === selected.id),
    },
  }
}
