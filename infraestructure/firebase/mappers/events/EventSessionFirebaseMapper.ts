import { GeoPoint, Timestamp } from "firebase-admin/firestore";
import type { EventSession } from "@/domain/entities/events/EventSession";
import type { FirebaseEventSessionDto } from "../../dto/events/FirebaseEventSessionDto";
import type { Location } from "@/domain/entities/events/value-objects/Location";
import type { LocationDetail, CityDetail } from "@/domain/shared/LocationDetail";

function detailWithSlug(d: unknown): LocationDetail {
  const o = (d ?? {}) as { isoCode?: unknown; name?: unknown; slug?: unknown };
  return {
    isoCode: typeof o.isoCode === "string" ? o.isoCode : "",
    name: typeof o.name === "string" ? o.name : "",
    slug: typeof o.slug === "string" ? o.slug : "",
  };
}

function cityDetail(c: unknown): CityDetail {
  if (typeof c === "string") return { name: c, slug: "" };
  const o = (c ?? {}) as { name?: unknown; slug?: unknown };
  return {
    name: typeof o.name === "string" ? o.name : "",
    slug: typeof o.slug === "string" ? o.slug : "",
  };
}

function toLatLng(coords: unknown): { lat: number; lng: number } {
  const c = (coords ?? {}) as {
    lat?: unknown;
    lng?: unknown;
    latitude?: unknown;
    longitude?: unknown;
  };
  return {
    lat:
      typeof c.latitude === "number"
        ? c.latitude
        : typeof c.lat === "number"
          ? c.lat
          : 0,
    lng:
      typeof c.longitude === "number"
        ? c.longitude
        : typeof c.lng === "number"
          ? c.lng
          : 0,
  };
}

function toDomainLocation(raw: unknown): Location {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    siteId: (r.siteId as string | null | undefined) ?? null,
    venue: typeof r.venue === "string" ? r.venue : "",
    address: typeof r.address === "string" ? r.address : "",
    moreInfo: typeof r.moreInfo === "string" ? r.moreInfo : "",
    city: cityDetail(r.city),
    department: detailWithSlug(r.department),
    country: detailWithSlug(r.country),
    coordinates: toLatLng(r.coordinates),
  };
}

function toStoredLocation(loc: Location) {
  const { lat, lng } = toLatLng(loc.coordinates);
  return {
    siteId: loc.siteId ?? null,
    venue: loc.venue,
    address: loc.address,
    moreInfo: loc.moreInfo ?? "",
    city: cityDetail(loc.city),
    department: detailWithSlug(loc.department),
    country: detailWithSlug(loc.country),
    coordinates: new GeoPoint(lat, lng),
  };
}

export class EventSessionFirebaseMapper {
  toDomain(dto: FirebaseEventSessionDto): EventSession {
    return {
      id: dto.id,
      eventId: dto.eventId,
      slug: dto.slug,
      title: dto.title,
      shortDescription: dto.shortDescription,
      description: dto.description,
      coverSource: dto.coverSource ?? "parent",
      mainImage: dto.mainImage,
      media: dto.media ?? [],
      location: toDomainLocation(dto.location),
      startDate: dto.startDate?.toDate ? dto.startDate.toDate() : new Date(),
      endDate: dto.endDate?.toDate ? dto.endDate.toDate() : new Date(),
      registrationType: dto.registrationType ?? "none",
      externalUrl: dto.externalUrl,
      capacity: dto.capacity,
      requiresAttendance: dto.requiresAttendance,
      registrationEventForm: dto.registrationEventForm,
      price: dto.price ?? { isFree: true, amount: 0, currency: "COP" },
      status: dto.status ?? "draft",
      analytics: dto.analytics,
      createdAt: dto.createdAt?.toDate ? dto.createdAt.toDate() : new Date(),
      updatedAt: dto.updatedAt?.toDate ? dto.updatedAt.toDate() : new Date(),
    };
  }

  toDto(domain: EventSession): FirebaseEventSessionDto {
    const now = Timestamp.now();
    return {
      id: domain.id,
      eventId: domain.eventId,
      slug: domain.slug,
      title: domain.title,
      shortDescription: domain.shortDescription,
      description: domain.description,
      coverSource: domain.coverSource,
      mainImage: domain.mainImage,
      media: domain.media ?? [],
      location: toStoredLocation(domain.location) as FirebaseEventSessionDto["location"],
      startDate: domain.startDate
        ? Timestamp.fromDate(domain.startDate)
        : now,
      endDate: domain.endDate ? Timestamp.fromDate(domain.endDate) : now,
      registrationType: domain.registrationType,
      externalUrl: domain.externalUrl,
      capacity: domain.capacity,
      requiresAttendance: domain.requiresAttendance,
      registrationEventForm: domain.registrationEventForm,
      price: domain.price,
      status: domain.status,
      createdAt: domain.createdAt ? Timestamp.fromDate(domain.createdAt) : now,
      updatedAt: Timestamp.now(),
    };
  }
}
