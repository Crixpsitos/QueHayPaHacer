import type { Activity, ActivityKind } from "./Activity"
import { isActivityCategory, isCompanion, type ActivityCategory, type Companion } from "./value-objects/ActivityCategory"
import { BUDGET_BANDS, budgetBand, type BudgetBand } from "./value-objects/Budget"
import { priceFromCop } from "./value-objects/Price"
import { firstOccurrenceIn, parseWhen, whenRange, type When } from "./when"

/** Filtros públicos del hub. Los de "cuándo", presupuesto y "con quién" se suman en la fase 2. */
export interface ActivityFilters {
  category?: ActivityCategory
  kind?: ActivityKind
  siteId?: string
  when?: When
  budget?: BudgetBand
  companion?: Companion
}

export const matchesFilters = (a: Pick<Activity, "category" | "kind" | "siteId" | "schedule" | "priceOptions" | "companions">, f: ActivityFilters, now: Date = new Date()): boolean =>
  (!f.category || a.category === f.category) &&
  (!f.kind || a.kind === f.kind) &&
  (!f.siteId || a.siteId === f.siteId) &&
  (!f.when || firstOccurrenceIn(a.schedule, whenRange(f.when, now), now) !== null) &&
  (!f.budget || budgetBand(priceFromCop(a.priceOptions)) === f.budget) &&
  (!f.companion || a.companions.includes(f.companion))

export interface UrlFilters {
  category?: ActivityCategory
  kind?: ActivityKind
  siteSlug?: string
  when?: When
  budget?: BudgetBand
  companion?: Companion
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
  const w = parseWhen(q.cuando)
  if (w) out.when = w
  const b = one(q.presupuesto)
  if (b && (BUDGET_BANDS as readonly string[]).includes(b)) out.budget = b as BudgetBand
  const c2 = one(q.con)
  if (c2 && isCompanion(c2)) out.companion = c2
  return out
}
