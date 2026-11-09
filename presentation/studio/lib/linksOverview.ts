import { FEW_DATA_BELOW, sourceShares, type SourceShare, type StatsTotals } from "@/domain/entities/analytics/fichaStats"

export interface FichaRef { type: "event" | "site"; id: string; name: string; image?: string }
export interface LinkRow { code: string; label: string; targetType: "event" | "site"; targetId: string; targetName: string; clicks: number }
export interface FichaCard extends FichaRef { views: number; clicks: number; fewData: boolean; sources: SourceShare[]; links: LinkRow[] }
export interface LinksOverview { fichas: FichaCard[]; totals: { views: number; clicks: number; linkClicks: number } }

/** Une fichas + estadísticas (clave `tipo:id`) + enlaces en las tarjetas del panel. Más vistas primero; el empate conserva el orden recibido. */
export function buildLinksOverview(fichas: FichaRef[], stats: Record<string, StatsTotals>, links: LinkRow[]): LinksOverview {
  const cards = fichas.map((f): FichaCard => {
    const s = stats[`${f.type}:${f.id}`] ?? { views: 0, clicks: 0, bySource: {}, viewsBy: {}, linkClicks: {}, byType: {} }
    return {
      ...f,
      views: s.views,
      clicks: s.clicks,
      fewData: s.views < FEW_DATA_BELOW,
      sources: sourceShares(s.bySource),
      links: links.filter((l) => l.targetType === f.type && l.targetId === f.id),
    }
  })
  cards.sort((a, b) => b.views - a.views)
  return {
    fichas: cards,
    totals: {
      views: cards.reduce((n, c) => n + c.views, 0),
      clicks: cards.reduce((n, c) => n + c.clicks, 0),
      linkClicks: cards.reduce((n, c) => n + c.links.reduce((m, l) => m + l.clicks, 0), 0),
    },
  }
}
