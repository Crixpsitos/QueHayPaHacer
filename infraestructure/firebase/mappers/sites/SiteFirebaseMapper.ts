import { GeoPoint } from "firebase-admin/firestore"
import { Coordinates } from "@/domain/entities/sites/value-objects/Coordinates"
import { ImageMedia } from "@/domain/entities/sites/value-objects/ImageMedia"
import { Schedule } from "@/domain/entities/sites/value-objects/Schedule"
import { SiteAuthor } from "@/domain/entities/sites/value-objects/SiteAuthor"
import { SiteLocation } from "@/domain/entities/sites/value-objects/SiteLocation"
import { Site } from "@/domain/entities/sites/Site"
import type { FirebaseSiteDto } from "../../dto/sites/FirebaseSiteDto"
import type { SiteDetail, SiteMediaItem } from "@/presentation/sites/view-models/SiteFormViewModel"

export class SiteFirebaseMapper {
  toDomain(dto: FirebaseSiteDto): Site {
    const coords = new Coordinates(
      dto.location.geo.latitude,
      dto.location.geo.longitude,
    )
    const location = new SiteLocation(
      coords,
      dto.location.country,
      dto.location.department,
      dto.location.city,
      dto.location.address,
      dto.location.venue,
      dto.location.moreInfo ?? "",
    )
    const media = dto.media.map((m) => {
      if (m.type === "image") {
        // markerUrl may be legacy string, new {url,path}, or missing
        const marker = typeof m.markerUrl === "string" ? m.markerUrl : (m.markerUrl?.url ?? "")
        return new ImageMedia(m.id, m.url, m.width, m.height, m.alt, marker, m.isCover)
      }
      // video — simplificado, solo guardamos lo esencial
      return new ImageMedia(m.id, m.url, 0, 0, "", "", false)
    })
    const schedule = new Schedule(
      dto.schedule.monday,
      dto.schedule.tuesday,
      dto.schedule.wednesday,
      dto.schedule.thursday,
      dto.schedule.friday,
      dto.schedule.saturday,
      dto.schedule.sunday,
    )
    const author: SiteAuthor = { uid: dto.author.id, displayName: dto.author.displayName, photoURL: dto.author.photoURL ?? "" }
    const analytics = dto.analytics as unknown as ConstructorParameters<typeof import("@/domain/entities/sites/value-objects/SiteAnalytics").SiteAnalytics>[0]

    return new Site(
      dto.id,
      dto.name,
      dto.slug,
      dto.description,
      location,
      media,
      schedule,
      author,
      dto.publicationStatus,
      dto.moderationStatus,
      dto.isActive,
      analytics as never,
      dto.createdAt?.toDate?.() ?? new Date(),
      dto.updatedAt?.toDate?.() ?? new Date(),
      dto.publishedAt?.toDate?.() ?? null,
      dto.reviewedAt?.toDate?.() ?? null,
      dto.reviewedBy,
      dto.rejectedAt?.toDate?.() ?? null,
      dto.rejectionReason,
    )
  }

  /** DTO → SiteDetail (presentation view model). No pasa por domain entity. */
  toSiteDetail(dto: FirebaseSiteDto): SiteDetail {
    const coverMedia = dto.media.find((m) => m.type === "image" && (m as { isCover?: boolean }).isCover === true) as (typeof dto.media[0] & { type: "image" }) | undefined
    const mediaUrls = dto.media
      .filter((m) => m.type === "image")
      .map((m) => m.url)
    const mediaItems: SiteMediaItem[] = dto.media.map((m) => ({
      id: m.id,
      url: m.url,
      type: m.type,
      isCover: (m as { isCover?: boolean }).isCover === true,
      status: (m as { status?: SiteMediaItem["status"] }).status,
      path: (m as { path?: string }).path,
      thumbnailUrl: (m as { thumbnailUrl?: string }).thumbnailUrl,
      duration: (m as { duration?: number }).duration,
    }))

    return {
      id: dto.id,
      slug: dto.slug,
      name: dto.name,
      category: (dto.category as SiteDetail["category"]) ?? "other",
      address: dto.location.address,
      coverUrl:
        (typeof coverMedia?.markerUrl === "string" ? coverMedia.markerUrl : coverMedia?.markerUrl?.url)
        ?? coverMedia?.url ?? "",
      coordinates: {
        latitude: dto.location.geo.latitude,
        longitude: dto.location.geo.longitude,
      },
      publicationStatus: dto.publicationStatus,
      moderationStatus: dto.moderationStatus,
      isActive: dto.isActive ?? false,
      rejectionReason: dto.rejectionReason,
      analytics: {
        clicks: dto.analytics.clicks ?? 0,
        likes: dto.analytics.likes ?? 0,
        shares: dto.analytics.shares ?? 0,
        eventCount: dto.analytics.eventCount ?? 0,
      },
      updatedAt: dto.updatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      // Campo computado: misma regla que Site.isNew (7 días) — este path bypasa la entidad
      isNew: (() => {
        const created = dto.createdAt?.toDate?.();
        if (!created) return false;
        return Date.now() - created.getTime() < 7 * 24 * 60 * 60 * 1000;
      })(),
      description: dto.description,
      views: dto.analytics.views ?? 0,
      schedule: {
        monday:    dto.schedule.monday,
        tuesday:   dto.schedule.tuesday,
        wednesday: dto.schedule.wednesday,
        thursday:  dto.schedule.thursday,
        friday:    dto.schedule.friday,
        saturday:  dto.schedule.saturday,
        sunday:    dto.schedule.sunday,
      },
      author: {
        id: dto.author.id,
        displayName: dto.author.displayName,
        photoURL: dto.author.photoURL,
      },
      mediaUrls,
      mediaItems,
    }
  }

  toDto(domain: Site, extra: { category: string; slug: string }): Omit<FirebaseSiteDto, "id" | "createdAt" | "updatedAt"> {
    return {
      name: domain.name,
      slug: extra.slug,
      category: extra.category,
      description: domain.description,
      location: {
        geo: new GeoPoint(domain.location.coordinates.latitude, domain.location.coordinates.longitude),
        country: domain.location.country,
        department: domain.location.department,
        city: domain.location.city,
        address: domain.location.address,
        venue: domain.location.venue,
        moreInfo: domain.location.moreInfo,
      },
      media: domain.media.map((m) => {
        if (m.type === "image") {
          return { id: m.id, type: "image" as const, path: "", url: m.url, width: m.width, height: m.height, alt: m.alt, markerUrl: { url: m.markerUrl, path: "" }, isCover: m.isCover }
        }
        return { id: m.id, type: "image" as const, path: "", url: m.url, width: 0, height: 0, alt: "", markerUrl: { url: "", path: "" }, isCover: false }
      }),
      schedule: domain.schedule,
      author: { id: domain.author.uid, displayName: domain.author.displayName, photoURL: domain.author.photoURL },
      publicationStatus: domain.publicationStatus,
      moderationStatus: domain.moderationStatus,
      isActive: domain.isActive,
      analytics: { clicks: 0, views: 0, likes: 0, shares: 0, eventCount: 0, score: 0 },
      publishedAt: null,
      reviewedAt: null,
      reviewedBy: null,
      rejectedAt: null,
      rejectionReason: null,
    }
  }
}
