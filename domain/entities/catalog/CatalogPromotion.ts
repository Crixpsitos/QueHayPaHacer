import { isPromoCurrent, isPromoLive, validatePromotions, promoScheduleLabel, type Promotion } from "@/domain/entities/activities/value-objects/Promotion"
import { cop, productPrice, type Product } from "./Product"

/**
 * Promoción del SITIO armada con dos productos: lo que se compra (`buy`) y lo que se recibe (`get`), que sale gratis, con un
 * porcentaje de descuento o a un precio especial. Puede ser el mismo producto dos veces («lleva 2, el 3.º gratis» = buy 2 + get 1).
 * Se muestra en las actividades elegidas (`activityIds`) cuya categoría admita promociones. Solo informa: no cobra.
 */
export const CATALOG_PROMOS_MAX = 20
export const PROMO_QTY_MAX = 10
export const PROMO_ACTIVITIES_MAX = 20
export const BENEFIT_KINDS = ["free", "percent", "special"] as const
export type BenefitKind = (typeof BENEFIT_KINDS)[number]

export interface PromoLine { productId: string; qty: number }
export interface CatalogPromotion {
  id: string
  title: string
  imageUrl: string
  buy: PromoLine
  get: PromoLine
  /** free: lo recibido sale gratis · percent: `value` % menos (1–99) · special: lo recibido cuesta `value` en total. */
  benefit: { kind: BenefitKind; value?: number }
  /** 0=domingo … 6=sábado; vacío = todos los días. */
  weekdays: number[]
  start: string
  end: string
  validFrom: string
  validUntil: string
  termsNote: string
  paused: boolean
  activityIds: string[]
}

/** Los campos de tiempo y texto se validan con las mismas reglas de las promociones de actividad. */
const timing = (x: CatalogPromotion): Promotion => ({ id: x.id, title: x.title, description: "", rule: { kind: "other" }, weekdays: x.weekdays, start: x.start, end: x.end, validFrom: x.validFrom, validUntil: x.validUntil, termsNote: x.termsNote, paused: x.paused })

export interface Pricing { normal: number; withPromo: number; saves: number }

/** Cuenta de la promoción con los precios de hoy. null si falta un producto. */
export function promoPricing(x: Pick<CatalogPromotion, "buy" | "get" | "benefit">, products: Product[], today: string): Pricing | null {
  const byId = new Map(products.map((p) => [p.id, p]))
  const b = byId.get(x.buy.productId)
  const g = byId.get(x.get.productId)
  if (!b || !g) return null
  const buyTotal = productPrice(b, today).now * x.buy.qty
  const getTotal = productPrice(g, today).now * x.get.qty
  const getWith = x.benefit.kind === "free" ? 0 : x.benefit.kind === "percent" ? Math.round(getTotal * (1 - (x.benefit.value ?? 0) / 100)) : Math.round(x.benefit.value ?? getTotal)
  const normal = buyTotal + getTotal
  const withPromo = buyTotal + Math.min(getWith, getTotal)
  return { normal, withPromo, saves: normal - withPromo }
}

export function validateCatalogPromotions(list: CatalogPromotion[], products: Product[], today: string): string | null {
  if (!Array.isArray(list)) return "Promociones inválidas."
  if (list.length > CATALOG_PROMOS_MAX) return `Máximo ${CATALOG_PROMOS_MAX} promociones.`
  const ids = new Set<string>()
  for (const x of list) {
    if (!x.id || ids.has(x.id)) return "Hay promociones repetidas."
    ids.add(x.id)
    const t = validatePromotions([timing(x)])
    if (t) return t
    if (x.imageUrl && !x.imageUrl.startsWith("https://")) return "La imagen debe ser un enlace seguro (https)."
    for (const line of [x.buy, x.get]) {
      if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > PROMO_QTY_MAX) return `La cantidad debe estar entre 1 y ${PROMO_QTY_MAX}.`
    }
    if (!BENEFIT_KINDS.includes(x.benefit.kind)) return "Tipo de beneficio inválido."
    const pr = promoPricing({ ...x, benefit: { kind: "free" } }, products, today)
    if (!pr) return "La promoción usa un producto que ya no está en la carta."
    const v = x.benefit.value
    if (x.benefit.kind === "percent" && !(Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 99)) return "El descuento debe estar entre 1 % y 99 %."
    if (x.benefit.kind === "special") {
      const getNormal = pr.normal - productPrice(products.find((p) => p.id === x.buy.productId)!, today).now * x.buy.qty
      if (!Number.isInteger(v) || (v as number) < 0 || (v as number) >= getNormal) return "El precio especial debe ser menor al precio normal de lo que se recibe."
    }
    if (!Array.isArray(x.activityIds) || x.activityIds.length > PROMO_ACTIVITIES_MAX || new Set(x.activityIds).size !== x.activityIds.length) return "Actividades inválidas."
  }
  return null
}

export const normalizeCatalogPromotions = (list: CatalogPromotion[]): CatalogPromotion[] =>
  list
    .map((x) => ({ ...x, title: x.title.trim(), termsNote: x.termsNote.trim(), imageUrl: x.imageUrl.trim(), weekdays: [...new Set(x.weekdays)].sort((a, b) => a - b) }))
    .filter((x) => x.title)
    .slice(0, CATALOG_PROMOS_MAX)

/** Vigente (sin pausar y dentro de sus fechas): lo único que se muestra al público. */
export const isCatalogPromoCurrent = (x: CatalogPromotion, now: Date): boolean => isPromoCurrent(timing(x), now)
/** Aplica ahora mismo (día y franja horaria). */
export const isCatalogPromoLive = (x: CatalogPromotion, now: Date): boolean => isPromoLive(timing(x), now)
export const catalogPromoSchedule = (x: CatalogPromotion): string => promoScheduleLabel(timing(x))

/** Las promociones vigentes que se muestran en una actividad (solo las que la eligieron). */
export const promosForActivity = (list: CatalogPromotion[], activityId: string, now: Date): CatalogPromotion[] =>
  list.filter((x) => x.activityIds.includes(activityId) && isCatalogPromoCurrent(x, now))

/** «Compras 1 Waffle y recibes 1 Sorbete de mora a mitad de precio.» */
export function describePromo(x: Pick<CatalogPromotion, "buy" | "get" | "benefit">, products: Product[]): string {
  const byId = new Map(products.map((p) => [p.id, p]))
  const b = byId.get(x.buy.productId)
  const g = byId.get(x.get.productId)
  if (!b || !g) return ""
  const same = b.id === g.id
  const what = (n: number, name: string) => `${n} ${name}`
  const how = x.benefit.kind === "free" ? "gratis" : x.benefit.kind === "percent" ? (x.benefit.value === 50 ? "a mitad de precio" : `con ${x.benefit.value} % de descuento`) : `por ${cop(x.benefit.value ?? 0)}`
  return same
    ? `Llevas ${what(x.buy.qty, b.name)} y ${what(x.get.qty, "más")} ${how}.`
    : `Compras ${what(x.buy.qty, b.name)} y recibes ${what(x.get.qty, g.name)} ${how}.`
}
