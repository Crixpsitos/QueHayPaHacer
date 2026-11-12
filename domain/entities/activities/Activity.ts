import type { JoinSettings } from "./activityJoin"
import type { SiteSection } from "@/domain/entities/sites/value-objects/SiteSections"
import { isActivityCategory, isCompanion, COMPANIONS_MAX, type ActivityCategory, type Companion } from "./value-objects/ActivityCategory"
import { validateSchedule, type ActivitySchedule } from "./value-objects/ActivitySchedule"
import { validateExtras, validatePriceOptions, type Extra, type PriceOption } from "./value-objects/Price"
import { validateOfferings, validateSpaces, type Offering, type Space } from "./value-objects/Offerings"
import { validatePromotions, type Promotion } from "./value-objects/Promotion"
import type { Cta } from "./value-objects/Cta"
import { mediaError, type ActivityMedia } from "./value-objects/ActivityMedia"

export type ActivityKind = "global" | "site"
export type ActivityPublicationStatus = "draft" | "published"
export type ActivityModerationStatus = "pending" | "approved" | "rejected"
export type Difficulty = "easy" | "medium" | "hard"

/** Quién organiza. `siteOwner` = perfil externo de un sitio administrado por QHPA (sin cuenta propia). */
export interface ActivityHost {
  kind: "user" | "siteOwner"
  id: string
  displayName: string
  photoURL: string
}

/** `fixed` exige texto; en `sharedAfterJoining` el punto se dice en el grupo de WhatsApp; `varies` cambia cada vez. */
export interface MeetingPoint {
  mode: "fixed" | "sharedAfterJoining" | "varies"
  text: string
  references: string
  geo: { lat: number; lng: number } | null
}

export interface ActivityRating {
  count: number
  sum: number
  avg: number
  /** Cantidad de reseñas con 1, 2, 3, 4 y 5 estrellas. */
  dist: [number, number, number, number, number]
}

export interface ActivityAnalytics {
  views: number
  clicks: number
  visits: number
  reviews: number
  /** Guardados (privado: nunca se muestra al público). */
  saves: number
}

export interface Activity {
  id: string
  slug: string
  title: string
  tagline: string
  description: string
  kind: ActivityKind
  siteId: string | null
  host: ActivityHost
  ownerUid: string
  category: ActivityCategory
  companions: Companion[]
  difficulty: Difficulty | null
  durationMinutes: number | null
  ageNote: string
  meetingPoint: MeetingPoint
  schedule: ActivitySchedule
  priceOptions: PriceOption[]
  extras: Extra[]
  sections: SiteSection[]
  /** Menú/productos y espacios reservables: SOLO actividades de sitio (spec 8.7). */
  offerings: Offering[]
  spaces: Space[]
  /** Promociones de sitio (máx. 5, caducan solas). */
  promotions: Promotion[]
  cta: Cta | null
  /** "Unirme" con cuenta: null = no recibe inscripciones. */
  join: JoinSettings | null
  /** Arreglo plano (como sitios): lo parchea el optimizador de `../functions`. */
  media: ActivityMedia[]
  rating: ActivityRating
  analytics: ActivityAnalytics
  publicationStatus: ActivityPublicationStatus
  moderationStatus: ActivityModerationStatus
  isActive: boolean
  reviewedAt: Date | null
  reviewedBy: string | null
  rejectedAt: Date | null
  rejectionReason: string | null
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
}

export const TITLE_MIN = 3
export const TITLE_MAX = 80
export const TAGLINE_MAX = 140
export const DESCRIPTION_MIN = 20
export const DESCRIPTION_MAX = 2000
export const AGE_NOTE_MAX = 120
export const MEETING_TEXT_MAX = 160
export const MEETING_REFERENCES_MAX = 240
export const DURATION_MIN = 15
export const DURATION_MAX = 1440

/** Sin HTML ni enlaces: lo único clicable de una actividad es su botón (spec 9.5, anti-spam de SEO). */
const URL_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|co|net|org|app|io|me|ly|info|biz)\b)/i
export function plainTextError(label: string, text: string): string | null {
  if (/[<>]/.test(text)) return `${label} no puede contener código ni etiquetas.`
  if (URL_RE.test(text)) return `${label} no puede contener enlaces: usa el botón de acción.`
  return null
}

/** Mensaje de error (español) si la actividad no se puede publicar; null si está completa y válida. */
export function activityPublishError(a: Activity): string | null {
  const title = a.title.trim()
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) return `El título debe tener entre ${TITLE_MIN} y ${TITLE_MAX} caracteres.`
  if (!a.slug.trim()) return "Falta el identificador de la página (slug)."
  if (a.tagline.length > TAGLINE_MAX) return `El gancho admite máximo ${TAGLINE_MAX} caracteres.`
  const desc = a.description.trim()
  if (desc.length < DESCRIPTION_MIN || desc.length > DESCRIPTION_MAX) return `La descripción debe tener entre ${DESCRIPTION_MIN} y ${DESCRIPTION_MAX} caracteres.`
  const text = plainTextError("El título", title) ?? plainTextError("El gancho", a.tagline) ?? plainTextError("La descripción", desc)
  if (text) return text
  if (a.ageNote.length > AGE_NOTE_MAX) return `La nota de edad admite máximo ${AGE_NOTE_MAX} caracteres.`
  if (!isActivityCategory(a.category)) return "Elige una categoría válida."
  if (a.companions.length > COMPANIONS_MAX || !a.companions.every(isCompanion) || new Set(a.companions).size !== a.companions.length) return "Las opciones de \"con quién\" no son válidas."
  if (a.difficulty !== null && !["easy", "medium", "hard"].includes(a.difficulty)) return "Dificultad inválida."
  if (a.durationMinutes !== null && (!Number.isInteger(a.durationMinutes) || a.durationMinutes < DURATION_MIN || a.durationMinutes > DURATION_MAX)) return "La duración debe estar entre 15 minutos y 24 horas."

  if (a.kind === "site" && !a.siteId) return "Una actividad de sitio debe estar vinculada a un sitio."
  if (a.kind === "global" && a.siteId) return "Una actividad global no puede tener sitio."
  if (a.kind === "global" && a.meetingPoint.mode === "fixed" && a.meetingPoint.text.trim().length < 3) return "Escribe el punto de encuentro (o elige que se dice en el grupo)."
  if (a.meetingPoint.text.length > MEETING_TEXT_MAX || a.meetingPoint.references.length > MEETING_REFERENCES_MAX) return "El punto de encuentro es demasiado largo."
  const meeting = plainTextError("El punto de encuentro", `${a.meetingPoint.text} ${a.meetingPoint.references}`)
  if (meeting) return meeting

  if (a.kind === "global" && (a.offerings.length || a.spaces.length || a.promotions.length)) return "El menú, los espacios y las promociones solo van en actividades de un sitio."
  return validateOfferings(a.offerings) ?? validateSpaces(a.spaces) ?? validatePromotions(a.promotions) ?? mediaError(a.media) ?? validateSchedule(a.schedule) ?? validatePriceOptions(a.priceOptions) ?? validateExtras(a.extras)
}
