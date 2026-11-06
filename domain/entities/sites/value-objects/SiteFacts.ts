/**
 * Tarjetas de datos rápidos de la ficha ("Entrada $20.000", "60 min", "Exigente"): se leen en 5 segundos
 * antes de la descripción. Icono de un catálogo cerrado (se dibuja con SVG, nunca emoji).
 */
export const FACT_ICON_OPTIONS = [
  { id: "price", label: "Precio" },
  { id: "time", label: "Duración" },
  { id: "schedule", label: "Horario" },
  { id: "distance", label: "Distancia" },
  { id: "level", label: "Dificultad" },
  { id: "people", label: "Para quién" },
  { id: "parking", label: "Parqueadero" },
  { id: "pets", label: "Mascotas" },
  { id: "food", label: "Comida" },
  { id: "other", label: "Otro" },
] as const

export type FactIconId = (typeof FACT_ICON_OPTIONS)[number]["id"]
export const FACT_ICON_IDS = FACT_ICON_OPTIONS.map((o) => o.id) as readonly FactIconId[]

export interface SiteFact {
  icon: FactIconId
  label: string
  value: string
}

export const FACTS_MAX = 6
export const FACT_LABEL_MAX = 24
export const FACT_VALUE_MAX = 40

/** Limpia lo que viene de Firestore o del cliente. Nunca lanza. */
export function normalizeFacts(raw: unknown): SiteFact[] {
  if (!Array.isArray(raw)) return []
  const out: SiteFact[] = []
  for (const item of raw) {
    if (out.length >= FACTS_MAX) break
    const r = (item && typeof item === "object" ? item : {}) as Record<string, unknown>
    if (typeof r.label !== "string" || typeof r.value !== "string") continue
    const label = r.label.trim().slice(0, FACT_LABEL_MAX).trim()
    const value = r.value.trim().slice(0, FACT_VALUE_MAX).trim()
    if (!label || !value) continue
    const icon = FACT_ICON_IDS.includes(r.icon as FactIconId) ? (r.icon as FactIconId) : "other"
    out.push({ icon, label, value })
  }
  return out
}

export const addFact = (list: SiteFact[]): SiteFact[] =>
  list.length >= FACTS_MAX ? list : [...list, { icon: "other", label: "", value: "" }]
