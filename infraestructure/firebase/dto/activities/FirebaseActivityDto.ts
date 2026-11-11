import type { Timestamp } from "firebase-admin/firestore"
import type { Activity, ActivityAnalytics, ActivityHost, ActivityKind, ActivityModerationStatus, ActivityPublicationStatus, ActivityRating, Difficulty, MeetingPoint } from "@/domain/entities/activities/Activity"
import type { ActivityCategory, Companion } from "@/domain/entities/activities/value-objects/ActivityCategory"
import type { ActivitySchedule } from "@/domain/entities/activities/value-objects/ActivitySchedule"
import type { Extra, PriceOption } from "@/domain/entities/activities/value-objects/Price"
import type { Cta } from "@/domain/entities/activities/value-objects/Cta"
import type { ActivityMedia } from "@/domain/entities/activities/value-objects/ActivityMedia"
import type { SiteSection } from "@/domain/entities/sites/value-objects/SiteSections"

/** Documento `activities/{id}` tal como se guarda en Firestore. Las fechas llegan como Timestamp al leer. */
export interface FirebaseActivityDto {
  slug: string
  title: string
  tagline: string
  description: string
  kind: ActivityKind
  siteId: string | null
  host: ActivityHost
  ownerUid: string
  category: ActivityCategory
  companions?: Companion[]
  difficulty: Difficulty | null
  durationMinutes: number | null
  ageNote: string
  meetingPoint: MeetingPoint
  schedule: ActivitySchedule
  priceOptions: PriceOption[]
  extras?: Extra[]
  sections?: SiteSection[]
  cta?: Cta | null
  /** Arreglo plano: lo parchea el optimizador de ../functions buscando por `path`. */
  media?: ActivityMedia[]
  rating?: ActivityRating
  analytics?: ActivityAnalytics
  publicationStatus: ActivityPublicationStatus
  moderationStatus: ActivityModerationStatus
  isActive: boolean
  /** Derivados para consultas "hoy" y "próxima salida" sin escanear la colección (los refresca la escritura y el barrido). */
  occursWeekdays: number[]
  nextOccurrenceAt: Timestamp | Date | null
  reviewedAt: Timestamp | Date | null
  reviewedBy: string | null
  rejectedAt: Timestamp | Date | null
  rejectionReason: string | null
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  publishedAt: Timestamp | Date | null
}
