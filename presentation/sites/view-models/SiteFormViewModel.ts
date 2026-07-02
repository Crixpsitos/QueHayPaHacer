export type SiteCategory =
  | "cafe"
  | "restaurant"
  | "bar"
  | "discotheque"
  | "mall"
  | "park"
  | "museum"
  | "hostel"
  | "hotel"
  | "cultural"
  | "viewpoint"
  | "gym"
  | "spa"
  | "theater"
  | "other"
export type WeekDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface DaySchedule {
  open: string
  close: string
  closed: boolean
}

export type SiteSchedule = Record<WeekDay, DaySchedule>

export interface SiteFormViewModel {
  coordinates: Coordinates | null
  address: string
  city: string
  citySlug: string
  region: string
  regionSlug: string
  country: string
  countrySlug: string
  name: string
  description: string
  category: SiteCategory | ""
  media: MediaFormItem[]
  schedule: SiteSchedule
}

// uploading → subiendo deopt (local) · processing → subido, CF optimizando · ready → CF listo
export type MediaUploadStatus = "uploading" | "processing" | "ready" | "error"

export interface MediaFormItem {
  id: string
  type: "image" | "video"
  url: string
  alt: string
  isCover: boolean
  status: MediaUploadStatus
  path?: string   // storage path — el optimizer CF matchea el media por este campo
}

export interface GeocodingResult {
  id: string
  label: string
  address: string
  lat: number
  lng: number
}

export type FormErrors = Partial<Record<keyof SiteFormViewModel, string>>

// ── List / browse types ──────────────────────────────────────────────────────

export type PublicationStatus = "draft" | "published"
export type ModerationStatus  = "pending" | "approved" | "rejected"
export type SiteDisplayStatus = "draft" | "pending" | "approved" | "rejected"
export type SiteFilterTab     = "all" | "approved" | "pending" | "rejected" | "draft"

export interface SiteAnalytics {
  clicks: number
  views: number
  likes: number
  shares: number
  eventCount: number
}

export interface SiteListItem {
  id: string
  name: string
  category: SiteCategory
  address: string
  coverUrl: string
  coordinates: Coordinates
  publicationStatus: PublicationStatus
  moderationStatus: ModerationStatus
  isActive: boolean
  rejectionReason: string | null
  analytics: Pick<SiteAnalytics, "clicks" | "likes" | "shares" | "eventCount">
  updatedAt: string
}

export interface SiteAuthor {
  id: string
  displayName: string
  photoURL?: string
}

export interface SiteMediaItem {
  id: string
  url: string
  type: "image" | "video"
  isCover: boolean
  status?: MediaUploadStatus
  path?: string   // storage path — se conserva al editar para no borrar el archivo optimizado
}

export interface SiteDetail extends SiteListItem {
  description: string
  views: number
  schedule: SiteSchedule
  author: SiteAuthor
  mediaUrls: string[]         // imágenes (compat)
  mediaItems?: SiteMediaItem[] // media tipada (image/video) para render y edición
}

export interface MapSiteMarker {
  id: string
  name: string
  coordinates: Coordinates
  status: SiteDisplayStatus
  coverUrl?: string
}
