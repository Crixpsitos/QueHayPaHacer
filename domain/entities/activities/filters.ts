import type { Activity, ActivityKind } from "./Activity"
import { isActivityCategory, isCompanion, type ActivityCategory, type Companion } from "./value-objects/ActivityCategory"
import { BUDGET_BANDS, budgetBand, type BudgetBand } from "./value-objects/Budget"
import { allOnRequest, priceFromCop } from "./value-objects/Price"
import { isPromoLive } from "./value-objects/Promotion"
import { dayRange, firstOccurrenceIn, parseDay, parseWhen, whenRange, type When } from "./when"

/** Filtros públicos del hub. Los de "cuándo", presupuesto y "con quién" se suman en la fase 2. */
export interface ActivityFilters {
  category?: ActivityCategory
  kind?: ActivityKind
  siteId?: string
  when?: When
  /** Un día concreto (YYYY-MM-DD) elegido en la semana. */
  day?: string
  budget?: BudgetBand
  companion?: Companion
  /** Solo actividades con una promoción que aplica en este momento. */
  promo?: boolean
}

export const matchesFilters = (a: Pick<Activity, "category" | "kind" | "siteId" | "schedule" | "priceOptions" | "companions"> & { promotions?: Activity["promotions"] }, f: ActivityFilters, now: Date = new Date()): boolean =>
  (!f.category || a.category === f.category) &&
  (!f.kind || a.kind === f.kind) &&
  (!f.siteId || a.siteId === f.siteId) &&
  (!f.when || firstOccurrenceIn(a.schedule, whenRange(f.when, now), now) !== null) &&
  (!f.day || firstOccurrenceIn(a.schedule, dayRange(f.day), now) !== null) &&
  (!f.budget || (!allOnRequest(a.priceOptions) && budgetBand(priceFromCop(a.priceOptions)) === f.budget)) &&
  (!f.companion || a.companions.includes(f.companion)) &&
  (!f.promo || (a.promotions ?? []).some((p) => isPromoLive(p, now)))

export interface UrlFilters {
  category?: ActivityCategory
  kind?: ActivityKind
  siteSlug?: string
  when?: When
  day?: string
  budget?: BudgetBand
  companion?: Companion
  promo?: boolean
}

const one = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined)

/** Lee los parámetros de la URL (`categoria`, `tipo`, `sitio`) y descarta lo que no es válido. */
export function parseFilters(q: Record<string, string | string[] | undefined>, now: Date = new Date()): UrlFilters {
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
  const dd = parseDay(q.dia, now)
  if (dd && !w) out.day = dd
  const b = one(q.presupuesto)
  if (b && (BUDGET_BANDS as readonly string[]).includes(b)) out.budget = b as BudgetBand
  const c2 = one(q.con)
  if (c2 && isCompanion(c2)) out.companion = c2
  if (one(q.promos) === "hoy") out.promo = true
  return out
}
