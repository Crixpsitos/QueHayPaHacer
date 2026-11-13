import { AMOUNT_COP_MAX } from "@/domain/entities/activities/value-objects/Price"

/**
 * Producto de la carta de un SITIO (comida, plantas, libros, artesanías…). Sin carrito ni pagos: quien mira pregunta por WhatsApp.
 * Las etiquetas las declara el dueño; la plataforma no las certifica.
 */
export const PRODUCTS_MAX = 60
export const PRODUCT_NAME_MAX = 60
export const PRODUCT_DESC_MAX = 200
export const PRODUCT_SECTION_MAX = 40
export const PRODUCT_TRACES_MAX = 80
export const PRODUCT_TAGS_MAX = 8

export const PRODUCT_UNITS = ["unidad", "porcion", "kilo", "libra", "docena", "bulto", "litro"] as const
export type ProductUnit = (typeof PRODUCT_UNITS)[number]
export const UNIT_LABELS: Record<ProductUnit, string> = { unidad: "c/u", porcion: "la porción", kilo: "por kilo", libra: "por libra", docena: "la docena", bulto: "el bulto", litro: "por litro" }

export const PRODUCT_TAGS = ["vegano", "vegetariano", "sin-gluten", "sin-lacteos", "sin-lactosa", "sin-azucar", "sin-frutos-secos", "contiene-nueces", "picante", "para-compartir", "para-llevar", "organico", "hecho-a-mano", "segura-mascotas", "toxica-mascotas"] as const
export type ProductTag = (typeof PRODUCT_TAGS)[number]
export const TAG_LABELS: Record<ProductTag, string> = {
  vegano: "Vegano", vegetariano: "Vegetariano", "sin-gluten": "Sin gluten", "sin-lacteos": "Sin lácteos", "sin-lactosa": "Sin lactosa", "sin-azucar": "Sin azúcar añadida",
  "sin-frutos-secos": "Sin frutos secos", "contiene-nueces": "Contiene nueces", picante: "Picante", "para-compartir": "Para compartir", "para-llevar": "Para llevar", organico: "Orgánico",
  "hecho-a-mano": "Hecho a mano", "segura-mascotas": "Segura para mascotas", "toxica-mascotas": "Tóxica para mascotas",
}
/** Etiquetas que avisan de un riesgo (se pintan en ámbar, no en verde). */
export const WARNING_TAGS: readonly ProductTag[] = ["contiene-nueces", "picante", "toxica-mascotas"]

export interface ProductDiscount { priceCop: number; /** YYYY-MM-DD (Bogotá), inclusive. Todo descuento caduca. */ until: string }
export interface Product {
  id: string
  name: string
  description: string
  priceCop: number
  unit: ProductUnit
  /** Sección de la carta ("Helados", "Plantas de interior"); vacío = sin sección. */
  section: string
  /** https de nuestro almacenamiento; vacío = sin foto (sale con el color de su sección). */
  photoUrl: string
  tags: ProductTag[]
  /** «Puede contener trazas de…» */
  traces: string
  discount: ProductDiscount | null
}

const URL_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|co|net|org|app|io|me|ly|info|biz)\b)/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const plain = (label: string, t: string) => (/[<>]/.test(t) ? `${label} no puede contener código ni etiquetas.` : URL_RE.test(t) ? `${label} no puede contener enlaces.` : null)
const money = (n: unknown) => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= AMOUNT_COP_MAX

export function validateProducts(list: Product[]): string | null {
  if (!Array.isArray(list)) return "Carta inválida."
  if (list.length > PRODUCTS_MAX) return `Máximo ${PRODUCTS_MAX} productos.`
  const ids = new Set<string>()
  for (const p of list) {
    if (!p.id || ids.has(p.id)) return "Hay productos repetidos."
    ids.add(p.id)
    const name = p.name.trim()
    if (!name || name.length > PRODUCT_NAME_MAX) return `El nombre del producto debe tener entre 1 y ${PRODUCT_NAME_MAX} caracteres.`
    if (p.description.length > PRODUCT_DESC_MAX) return `La descripción admite máximo ${PRODUCT_DESC_MAX} caracteres.`
    if (p.section.length > PRODUCT_SECTION_MAX) return `La sección admite máximo ${PRODUCT_SECTION_MAX} caracteres.`
    if (p.traces.length > PRODUCT_TRACES_MAX) return `Las trazas admiten máximo ${PRODUCT_TRACES_MAX} caracteres.`
    const bad = plain("El producto", `${name} ${p.description} ${p.section} ${p.traces}`)
    if (bad) return bad
    if (!money(p.priceCop)) return "El precio debe ser un número entero en pesos, de 0 en adelante."
    if (!(PRODUCT_UNITS as readonly string[]).includes(p.unit)) return "Unidad de venta inválida."
    if (p.photoUrl && !p.photoUrl.startsWith("https://")) return "La foto debe ser un enlace seguro (https)."
    if (!Array.isArray(p.tags) || p.tags.length > PRODUCT_TAGS_MAX || new Set(p.tags).size !== p.tags.length || !p.tags.every((t) => (PRODUCT_TAGS as readonly string[]).includes(t))) return "Etiquetas inválidas."
    if (p.tags.includes("segura-mascotas") && p.tags.includes("toxica-mascotas")) return "Un producto no puede ser segura y tóxica para mascotas a la vez."
    if (p.discount) {
      if (!money(p.discount.priceCop) || p.discount.priceCop >= p.priceCop) return "El precio con descuento debe ser menor al precio normal."
      if (!DATE_RE.test(p.discount.until)) return "Indica hasta cuándo vale el descuento: todo descuento caduca."
    }
  }
  return null
}

export const normalizeProducts = (list: Product[]): Product[] =>
  list.map((p) => ({ ...p, name: p.name.trim(), description: p.description.trim(), section: p.section.trim(), traces: p.traces.trim(), photoUrl: p.photoUrl.trim() })).filter((p) => p.name).slice(0, PRODUCTS_MAX)

const BOGOTA = 5 * 3_600_000
/** Hoy en Bogotá, YYYY-MM-DD. */
export const todayBogota = (now: Date): string => new Date(now.getTime() - BOGOTA).toISOString().slice(0, 10)

/** Precio que se cobra hoy y, si hay descuento vigente, el normal tachado (`was`). Un descuento vencido nunca se muestra. */
export function productPrice(p: Pick<Product, "priceCop" | "discount">, today: string): { now: number; was: number | null } {
  return p.discount && p.discount.until >= today ? { now: p.discount.priceCop, was: p.priceCop } : { now: p.priceCop, was: null }
}
export const discountPercent = (was: number, now: number): number => (was > 0 ? Math.round((1 - now / was) * 100) : 0)

/** Secciones en orden de aparición, con sus productos. Los sin sección van al final en «Otros». */
export function groupBySection<T extends { section: string }>(list: T[]): { section: string; items: T[] }[] {
  const order: string[] = []
  const map = new Map<string, T[]>()
  for (const p of list) {
    const k = p.section || ""
    if (!map.has(k)) { map.set(k, []); order.push(k) }
    map.get(k)!.push(p)
  }
  const named = order.filter((k) => k !== "").map((k) => ({ section: k, items: map.get(k)! }))
  return map.has("") ? [...named, { section: "Otros", items: map.get("")! }] : named
}

export const PRICES_NOTE = "Precios sujetos a cambio: confirma con el lugar. Las etiquetas las declara el sitio."

export const cop = (n: number): string => `$${Math.trunc(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`
