// infrastructure/firebase/dtos/FirebaseSiteDto.ts
import type { GeoPoint, Timestamp } from "firebase-admin/firestore"

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

interface RawLocationDto {
  geo: GeoPoint                
  countrySlug: string
  country: string
  regionSlug: string
  region: string
  citySlug: string
  city: string
  address: string
}

interface RawAuthorDto {
  id: string
  displayName: string
  photoURL?: string
}

interface RawAnalyticsDto {
  clicks: number
  views: number
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
}