import { colombianNumber } from "@/domain/entities/activities/value-objects/Cta"
import { normalizeProducts, validateProducts, todayBogota, type Product } from "./Product"
import { normalizeCatalogPromotions, validateCatalogPromotions, type CatalogPromotion } from "./CatalogPromotion"

/** La carta de un sitio: productos, promociones de dos productos y a dónde se pregunta. Un documento por sitio. */
export interface SiteCatalog {
  siteId: string
  /** WhatsApp (10 dígitos de Colombia) al que llegan las preguntas. Vacío = no se puede preguntar. */
  whatsapp: string
  /** Número al que se llama para reservar (opcional). Vacío = sin botón «Reservar». */
  reservePhone: string
  products: Product[]
  promotions: CatalogPromotion[]
}

export const emptyCatalog = (siteId: string): SiteCatalog => ({ siteId, whatsapp: "", reservePhone: "", products: [], promotions: [] })

/** Limpia y normaliza lo que llega del cliente: números de teléfono a 10 dígitos, listas recortadas. */
export function normalizeCatalog(c: SiteCatalog): SiteCatalog {
  const num = (raw: string) => colombianNumber(raw ?? "") ?? ""
  const products = normalizeProducts(c.products ?? [])
  return {
    siteId: c.siteId,
    whatsapp: num(c.whatsapp),
    reservePhone: num(c.reservePhone),
    products,
    promotions: normalizeCatalogPromotions(c.promotions ?? []).map((x) => ({ ...x, activityIds: x.activityIds ?? [] })),
  }
}

export function validateCatalog(c: SiteCatalog, now: Date): string | null {
  for (const [raw, label] of [[c.whatsapp, "El WhatsApp"], [c.reservePhone, "El número de reservas"]] as const) {
    if (raw && !colombianNumber(raw)) return `${label} debe tener 10 dígitos de Colombia (empieza por 3 si es celular).`
  }
  return validateProducts(c.products) ?? validateCatalogPromotions(c.promotions, c.products, todayBogota(now))
}
