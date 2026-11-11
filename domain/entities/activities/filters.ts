import type { Activity, ActivityKind } from "./Activity"
import { isActivityCategory, type ActivityCategory } from "./value-objects/ActivityCategory"

/** Filtros públicos del hub. Los de "cuándo", presupuesto y "con quién" se suman en la fase 2. */
export interface ActivityFilters {
  category?: ActivityCategory
  kind?: ActivityKind
  siteId?: string
}

export const matchesFilters = (a: Pick<Activity, "category" | "kind" | "siteId">, f: ActivityFilters): boolean =>
  (!f.category || a.category === f.category) && (!f.kind || a.kind === f.kind) && (!f.siteId || a.siteId === f.siteId)

export interface UrlFilters {
  category?: ActivityCategory
  kind?: ActivityKind
  siteSlug?: string
}

const one = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined)

/** Lee los parámetros de la URL (`categoria`, `tipo`, `sitio`) y descarta lo que no es válido. */
export function parseFilters(q: Record<string, string | string[] | undefined>): UrlFilters {
  const out: UrlFilters = {}
  const c = one(q.categoria)
  if (c && isActivityCategory(c)) out.category = c
  const t = one(q.tipo)
  if (t === "global") out.kind = "global"
  else if (t === "sitio") out.kind = "site"
  const s = one(q.sitio)
  if (s && /^[a-z0-9-]{1,80}$/.test(s)) out.siteSlug = s
  return out
}
