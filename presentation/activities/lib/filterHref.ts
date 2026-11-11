import type { UrlFilters } from "@/domain/entities/activities/filters"

/** Enlace del hub con los filtros actuales más un cambio (`undefined` quita ese filtro). Orden fijo para que la URL sea estable. */
export function filterHref(current: UrlFilters, patch: Partial<Record<keyof UrlFilters, string | undefined>>): string {
  const merged: Record<string, string | undefined> = { category: current.category, kind: current.kind, siteSlug: current.siteSlug, ...patch }
  const q = new URLSearchParams()
  if (merged.category) q.set("categoria", merged.category)
  if (merged.kind) q.set("tipo", merged.kind === "site" ? "sitio" : "global")
  if (merged.siteSlug) q.set("sitio", merged.siteSlug)
  const s = q.toString()
  return s ? `/actividades?${s}` : "/actividades"
}
