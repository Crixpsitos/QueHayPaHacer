/** Acciones que se miden en la ficha pública de un sitio (ver docs/26-medicion-sitios.md). */
export const SITE_TRACK_TYPES = ["view", "directions", "website", "social", "booking", "call", "share", "transit"] as const
export type SiteTrackType = (typeof SITE_TRACK_TYPES)[number]

export const isSiteTrackType = (v: unknown): v is SiteTrackType => SITE_TRACK_TYPES.includes(v as SiteTrackType)

/** Id del doc diario (`sites/{id}/stats/{día}`): el día calendario en Bogotá, no en UTC. */
export const bogotaDay = (date: Date = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(date)
