import { hasRecommendations, type SiteRecommendations } from "./value-objects/SiteRecommendations"
import type { SiteOpeningPolicy } from "./value-objects/SiteOpeningPolicy"

/** Lo mínimo que el medidor necesita leer (lo cumplen el formulario y el detalle, ver presentation/sites/lib/completeness). */
export interface CompletenessInput {
  hasCover: boolean
  description: string
  schedule: Record<string, { closed: boolean }>
  address: string
  openingPolicy?: SiteOpeningPolicy
  socialMedia?: object
  bookingUrl?: string
  recommendations?: SiteRecommendations
}

export interface CompletenessRule {
  id: string
  /** Lo que se cumple, en afirmativo. */
  label: string
  /** Qué hacer si falta. */
  hint: string
  done: (input: CompletenessInput) => boolean
}

export const DESCRIPTION_MIN = 80

// Para sumar reglas basta añadirlas aquí: el porcentaje se calcula sobre la longitud de la lista.
export const COMPLETENESS_RULES: CompletenessRule[] = [
  { id: "cover", label: "Portada", hint: "Agrega una foto de portada", done: (i) => i.hasCover },
  {
    id: "description", label: "Descripción", hint: `Describe el lugar en al menos ${DESCRIPTION_MIN} caracteres`,
    done: (i) => i.description.trim().length >= DESCRIPTION_MIN,
  },
  {
    id: "schedule", label: "Horario", hint: "Marca al menos un día abierto en el horario",
    done: (i) => Object.values(i.schedule).some((d) => !d.closed),
  },
  { id: "address", label: "Dirección", hint: "Indica la dirección", done: (i) => i.address.trim().length > 0 },
  { id: "holidays", label: "Festivos", hint: "Cuenta si abres los festivos", done: (i) => !!i.openingPolicy?.holidays },
  { id: "rain", label: "Lluvia", hint: "Cuenta qué pasa si llueve", done: (i) => !!i.openingPolicy?.rain },
  {
    id: "contact", label: "Redes o reserva", hint: "Añade una red social, tu sitio web o un enlace de reserva",
    done: (i) => !!i.bookingUrl?.trim() || Object.values(i.socialMedia ?? {}).some((v) => typeof v === "string" && !!v.trim()),
  },
  { id: "tips", label: "Recomendaciones", hint: "Deja al menos una recomendación para quien te visite", done: (i) => hasRecommendations(i.recommendations) },
]

export interface Completeness {
  done: number
  total: number
  /** 0–100, redondeado. */
  percent: number
  complete: boolean
  pending: CompletenessRule[]
}

export function getSiteCompleteness(input: CompletenessInput, rules: CompletenessRule[] = COMPLETENESS_RULES): Completeness {
  const pending = rules.filter((r) => !r.done(input))
  const total = rules.length
  const done = total - pending.length
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0, complete: pending.length === 0 && total > 0, pending }
}
