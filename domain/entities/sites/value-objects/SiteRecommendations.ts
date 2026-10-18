/**
 * Recomendaciones que el autor deja a quien va a visitar el sitio. Opcional (se incentiva, no se obliga):
 * catálogo cerrado de casillas + una nota corta libre.
 */
export const SITE_TIP_OPTIONS = [
  { id: "go-early", label: "Mejor ir temprano" },
  { id: "go-weekdays", label: "Menos gente entre semana" },
  { id: "bring-cash", label: "Lleva efectivo" },
  { id: "sun-water", label: "Lleva agua y protector solar" },
  { id: "comfy-shoes", label: "Usa calzado cómodo" },
  { id: "parking", label: "Hay parqueadero" },
  { id: "book-ahead", label: "Conviene reservar" },
  { id: "kids", label: "Apto para niños" },
  { id: "pets", label: "Admite mascotas" },
  { id: "rain-gear", label: "Lleva ropa para la lluvia" },
] as const

export type TipId = (typeof SITE_TIP_OPTIONS)[number]["id"]

export const SITE_TIP_IDS = SITE_TIP_OPTIONS.map((t) => t.id) as readonly TipId[]
export const SITE_TIP_LABELS = Object.fromEntries(SITE_TIP_OPTIONS.map((t) => [t.id, t.label])) as Record<TipId, string>

export const TIP_NOTE_MAX = 140

export interface SiteRecommendations {
  tips: TipId[]
  note?: string
}

/**
 * Limpia lo que viene de Firestore o del cliente: descarta ids desconocidos o repetidos (conserva el orden
 * del catálogo) y recorta la nota. Nunca lanza.
 */
export function normalizeRecommendations(raw: unknown): SiteRecommendations {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const picked = new Set(Array.isArray(r.tips) ? r.tips : [])
  const tips = SITE_TIP_IDS.filter((id) => picked.has(id))
  const note = typeof r.note === "string" ? r.note.trim().slice(0, TIP_NOTE_MAX).trim() : ""
  return { tips, ...(note ? { note } : {}) }
}

export const hasRecommendations = (r?: SiteRecommendations) => !!r && (r.tips.length > 0 || !!r.note)
