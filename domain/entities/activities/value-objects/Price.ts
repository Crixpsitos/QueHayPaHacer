/** Opciones de precio y extras de una actividad (spec 5.5). Todo en pesos colombianos enteros. */
export const PRICE_UNITS = ["persona", "grupo", "hora", "unidad", "consultar"] as const
export type PriceUnit = (typeof PRICE_UNITS)[number]
export const EXTRA_UNITS = ["persona", "grupo", "unidad"] as const
export type ExtraUnit = (typeof EXTRA_UNITS)[number]

/** «Consultar»: el precio depende del día, el formato o el lugar (cines, tours): no se inventa un valor; se manda al sitio oficial. */
export const isOnRequest = (o: { unit: string }) => o.unit === "consultar"
export const allOnRequest = (opts: { unit: string }[]) => opts.length > 0 && opts.every(isOnRequest)

export interface PriceOption {
  label: string
  amountCop: number
  unit: PriceUnit
  /** Qué incluye ("Almuerzo", "Guía"). */
  includes: string[]
  note?: string
}

export interface Extra {
  label: string
  amountCop: number
  unit: ExtraUnit
  note?: string
}

export const PRICE_OPTIONS_MAX = 8
export const EXTRAS_MAX = 10
export const PRICE_LABEL_MAX = 40
export const INCLUDES_MAX = 6
export const INCLUDE_ITEM_MAX = 40
export const PRICE_NOTE_MAX = 120
export const AMOUNT_COP_MAX = 100_000_000

const amountError = (n: unknown) =>
  Number.isInteger(n) && (n as number) >= 0 && (n as number) <= AMOUNT_COP_MAX ? null : "El precio debe ser un número entero en pesos, de 0 en adelante."

function commonError(i: { label: string; amountCop: number; note?: string }): string | null {
  if (typeof i.label !== "string" || !i.label.trim() || i.label.trim().length > PRICE_LABEL_MAX) return `El nombre debe tener entre 1 y ${PRICE_LABEL_MAX} caracteres.`
  return amountError(i.amountCop) ?? (i.note !== undefined && i.note.length > PRICE_NOTE_MAX ? `La nota admite máximo ${PRICE_NOTE_MAX} caracteres.` : null)
}

export function validatePriceOptions(opts: PriceOption[]): string | null {
  if (!Array.isArray(opts) || opts.length === 0) return "Agrega al menos una opción de precio (puede ser gratis)."
  if (opts.length > PRICE_OPTIONS_MAX) return `Máximo ${PRICE_OPTIONS_MAX} opciones de precio.`
  for (const o of opts) {
    const e = commonError(o)
    if (e) return e
    if (!(PRICE_UNITS as readonly string[]).includes(o.unit)) return "Unidad de precio inválida."
    if (isOnRequest(o) && o.amountCop !== 0) return "Una opción «a consultar» no lleva valor."
    if (!Array.isArray(o.includes) || o.includes.length > INCLUDES_MAX || o.includes.some((x) => typeof x !== "string" || !x.trim() || x.length > INCLUDE_ITEM_MAX))
      return `Lo que incluye admite hasta ${INCLUDES_MAX} ítems de máximo ${INCLUDE_ITEM_MAX} caracteres.`
  }
  return null
}

export function validateExtras(extras: Extra[]): string | null {
  if (!Array.isArray(extras)) return "Extras inválidos."
  if (extras.length > EXTRAS_MAX) return `Máximo ${EXTRAS_MAX} extras.`
  for (const x of extras) {
    const e = commonError(x)
    if (e) return e
    if (!(EXTRA_UNITS as readonly string[]).includes(x.unit)) return "Unidad de extra inválida."
  }
  return null
}

/** Precio "desde": la opción más barata. Los extras no cuentan. */
export const priceFromCop = (opts: PriceOption[]): number => {
  const known = opts.filter((o) => !isOnRequest(o))
  return known.length ? Math.min(...known.map((o) => o.amountCop)) : 0
}

/** 40000 → "$40.000" */
export const formatCop = (n: number): string => `$${Math.trunc(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`
