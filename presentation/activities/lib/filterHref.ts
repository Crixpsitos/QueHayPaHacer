import type { UrlFilters } from "@/domain/entities/activities/filters"

/** Enlace del hub con los filtros actuales más un cambio (`undefined` quita ese filtro). Orden fijo para que la URL sea estable. */
export function filterHref(current: UrlFilters, patch: Partial<Record<keyof UrlFilters, string | undefined>>): string {
  const merged: Record<string, string | undefined> = { category: current.category, kind: current.kind, siteSlug: current.siteSlug, when: current.when, day: current.day, budget: current.budget, companion: current.companion, ...patch }
  // «cuándo» y un día concreto se excluyen: el último que se elige gana
  if (patch.when) merged.day = undefined
  if (patch.day) merged.when = undefined
  const q = new URLSearchParams()
  if (merged.category) q.set("categoria", merged.category)
  if (merged.kind) q.set("tipo", merged.kind === "site" ? "sitio" : "global")
  if (merged.siteSlug) q.set("sitio", merged.siteSlug)
  if (merged.when) q.set("cuando", merged.when)
  if (merged.day) q.set("dia", merged.day)
  if (merged.budget) q.set("presupuesto", merged.budget)
  if (merged.companion) q.set("con", merged.companion)
  const s = q.toString()
  return s ? `/actividades?${s}` : "/actividades"
}
