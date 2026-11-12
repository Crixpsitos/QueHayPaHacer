import { AMOUNT_COP_MAX } from "./Price"

/** Espacios reservables de una actividad de SITIO (spec 8.7). Sin carrito ni pagos: el botón es la CTA externa. El menú vive en la carta del sitio (`domain/entities/catalog`). */
export const SPACES_MAX = 10
export const OFFERING_NAME_MAX = 60
export const OFFERING_DESC_MAX = 200
export const SPACE_RULES_MAX = 300
export const SPACE_CAPACITY_MAX = 1000
export const SPACE_UNITS = ["hora", "dia", "persona", "evento"] as const
export type SpaceUnit = (typeof SPACE_UNITS)[number]
export const PRICES_DISCLAIMER = "Precios sujetos a cambio: confirma con el lugar."

export interface Space { name: string; description: string; capacity: number; priceCop: number; unit: SpaceUnit; rules: string }

const URL_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|co|net|org|app|io|me|ly|info|biz)\b)/i
const plain = (label: string, t: string) => (/[<>]/.test(t) ? `${label} no puede contener código ni etiquetas.` : URL_RE.test(t) ? `${label} no puede contener enlaces: usa el botón de acción.` : null)
const money = (n: unknown) => (Number.isInteger(n) && (n as number) >= 0 && (n as number) <= AMOUNT_COP_MAX ? null : "El precio debe ser un número entero en pesos, de 0 en adelante.")

export function validateSpaces(list: Space[]): string | null {
  if (!Array.isArray(list)) return "Espacios inválidos."
  if (list.length > SPACES_MAX) return `Máximo ${SPACES_MAX} espacios.`
  for (const x of list) {
    if (typeof x.name !== "string" || !x.name.trim() || x.name.trim().length > OFFERING_NAME_MAX) return `El nombre del espacio debe tener entre 1 y ${OFFERING_NAME_MAX} caracteres.`
    if (x.description.length > OFFERING_DESC_MAX) return `La descripción del espacio admite máximo ${OFFERING_DESC_MAX} caracteres.`
    if (x.rules.length > SPACE_RULES_MAX) return `Las reglas admiten máximo ${SPACE_RULES_MAX} caracteres.`
    if (!Number.isInteger(x.capacity) || x.capacity < 1 || x.capacity > SPACE_CAPACITY_MAX) return `La capacidad debe estar entre 1 y ${SPACE_CAPACITY_MAX} personas.`
    if (!(SPACE_UNITS as readonly string[]).includes(x.unit)) return "Unidad de espacio inválida."
    const e = money(x.priceCop) ?? plain("El espacio", `${x.name} ${x.description} ${x.rules}`)
    if (e) return e
  }
  return null
}

export const normalizeSpaces = (list: Space[]): Space[] =>
  list.map((x) => ({ ...x, name: x.name.trim(), description: x.description.trim(), rules: x.rules.trim() })).filter((x) => x.name).slice(0, SPACES_MAX)
