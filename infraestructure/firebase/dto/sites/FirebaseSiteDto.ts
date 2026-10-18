// infrastructure/firebase/dtos/FirebaseSiteDto.ts
import type { GeoPoint, Timestamp } from "firebase-admin/firestore"
import type { SiteOpeningPolicy } from "@/domain/entities/sites/value-objects/SiteOpeningPolicy"
import type { SiteRecommendations } from "@/domain/entities/sites/value-objects/SiteRecommendations"
import type { SiteTransit } from "@/domain/entities/sites/value-objects/SiteTransit"

interface RawImageMediaDto {
  id: string
  type: "image"
  path: string          // storage path — el optimizer CF matchea el media por este campo
  url: string
  width: number
  height: number
  alt: string
  status?: "processing" | "ready" | "error"
  thumbnailUrl?: string
  thumbnailPath?: string
  markerUrl: { url: string; path: string }
  isCover: boolean
}

interface RawVideoMediaDto {
  id: string
  type: "video"
  path: string          // storage path — el optimizer CF matchea el media por este campo
  url: string
  width: number
  height: number
  duration: number
  mimeType?: string
  status?: "processing" | "ready" | "error"
  thumbnailUrl?: string
  thumbnailPath?: string
  markerUrl?: { url: string; path: string }
  isCover: boolean
}

type RawMediaDto = RawImageMediaDto | RawVideoMediaDto

interface RawDayScheduleDto {
  open: string
  close: string
  closed: boolean
}

interface RawScheduleDto {
  monday: RawDayScheduleDto
  tuesday: RawDayScheduleDto
  wednesday: RawDayScheduleDto
  thursday: RawDayScheduleDto
  friday: RawDayScheduleDto
  saturday: RawDayScheduleDto
  sunday: RawDayScheduleDto
}

interface RawGeoDetailDto {
  isoCode: string
  name: string
  slug: string
}

interface RawCityDetailDto {
  name: string
  slug: string
}

interface RawLocationDto {
  geo: GeoPoint                       // GeoPoint nativo de Firebase — SE MANTIENE
  lat?: number                        // campo plano para consultas cliente
  lng?: number
  country: RawGeoDetailDto
  department: RawGeoDetailDto
  city: RawCityDetailDto
  address: string
  venue: string
  moreInfo: string
}

interface RawAuthorDto {
  id: string
  displayName: string
  photoURL?: string
}

interface RawAnalyticsDto {
  clicks: number
  views?: number
  likes: number
  shares: number
  eventCount: number
  score: number
}

export interface FirebaseSiteDto {
  id: string
  name: string
  slug: string
  category: string
  description: string
  location: RawLocationDto
  media: RawMediaDto[]
  schedule: RawScheduleDto
  author: RawAuthorDto
  publicationStatus: "draft" | "published"
  moderationStatus: "pending" | "approved" | "rejected"
  isActive: boolean
  analytics: RawAnalyticsDto
  createdAt: Timestamp          // ← Timestamp crudo, NO Date
  updatedAt: Timestamp
  publishedAt: Timestamp | null
  reviewedAt: Timestamp | null
  reviewedBy: string | null
  rejectedAt: Timestamp | null
  rejectionReason: string | null
  // Campos opcionales nuevos
  socialMedia?: {
    instagram?: string
    facebook?: string
    tiktok?: string
    twitter?: string
    website?: string
  }
  temporarilyClosed?: {
    isClosed: boolean
    reason: string
  }
  bookingUrl?: string
  // Buses que llegan (a mano, del catálogo). null = el autor lo quitó. `updatedAt` lo fija el servidor.
  transit?: SiteTransit | null
  // Qué hace el sitio en festivos y con lluvia (opcional: sin dato = sin confirmar).
  openingPolicy?: SiteOpeningPolicy
  // Consejos del autor para quien visita (opcional).
  recommendations?: SiteRecommendations
  // Tipo y confianza de la ficha (ver SiteListing). Opcionales: los sitios viejos no los traen.
  kind?: "public" | "business"
  publishedAs?: "owner" | "proposer" | "qhpa"
  verification?: "community" | "claimed" | "verified"
  // La ficha cumple todas las reglas del medidor (siteCompleteness). Se calcula al guardar; da un bono al ranking.
  listingComplete?: boolean
}