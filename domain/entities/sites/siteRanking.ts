/**
 * Puntaje de un sitio para ordenar los listados públicos (`analytics.score`).
 * Antes nadie lo calculaba con datos reales (solo los sembrados lo traían) y "Destacados" exigía score ≥ 20: quedaba
 * vacío. Ahora se calcula siempre: interacciones reales + un bono pequeño por ficha completa (ver siteCompleteness).
 * El bono (10) vale como ~3 "me gusta": empuja a quien cuida su ficha sin taparlo todo.
 */
export const SITE_SCORE_WEIGHTS = { like: 3, share: 5, event: 4 } as const
export const COMPLETE_LISTING_BONUS = 10
/** Tope de eventos que cuentan para el puntaje (5 × 4 = 20): publicar muchos no escala el ranking. */
export const SITE_SCORE_MAX_EVENTS = 5

export interface SiteScoreInput {
  likes?: number
  shares?: number
  eventCount?: number
}

const n = (v: number | undefined) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0)

export function siteScore(analytics: SiteScoreInput | null | undefined, listingComplete: boolean | undefined): number {
  const a = analytics ?? {}
  return Math.round(
    n(a.likes) * SITE_SCORE_WEIGHTS.like +
      n(a.shares) * SITE_SCORE_WEIGHTS.share +
      Math.min(n(a.eventCount), SITE_SCORE_MAX_EVENTS) * SITE_SCORE_WEIGHTS.event +
      (listingComplete ? COMPLETE_LISTING_BONUS : 0),
  )
}
