import { Timestamp, GeoPoint } from "firebase-admin/firestore";
import { Events } from "@/domain/entities/events/Events";
import type { Location } from "@/domain/entities/events/value-objects/Location";
import type { LocationDetail, CityDetail } from "@/domain/shared/LocationDetail";
import { FirebaseEventsDto } from "../../dto/events/FirebaseEventsDto";
import { IEventsMapper } from "./IEventsMapper";

/** country/department: preserva isoCode+name, garantiza slug ("" si falta). */
function detailWithSlug(d: unknown): LocationDetail {
  const o = (d ?? {}) as { isoCode?: unknown; name?: unknown; slug?: unknown };
  return {
    isoCode: typeof o.isoCode === "string" ? o.isoCode : "",
    name: typeof o.name === "string" ? o.name : "",
    slug: typeof o.slug === "string" ? o.slug : "",
  };
}

/** city: acepta string (forma vieja) u objeto {name,slug} (nueva) → siempre objeto. */
function cityDetail(c: unknown): CityDetail {
  if (typeof c === "string") return { name: c, slug: "" };
  const o = (c ?? {}) as { name?: unknown; slug?: unknown };
  return {
    name: typeof o.name === "string" ? o.name : "",
    slug: typeof o.slug === "string" ? o.slug : "",
  };
}

/** coordinates: acepta GeoPoint (nuevo) o {lat,lng} (viejo) → {lat,lng} en dominio. */
function toLatLng(coords: unknown): { lat: number; lng: number } {
  const c = (coords ?? {}) as { lat?: unknown; lng?: unknown; latitude?: unknown; longitude?: unknown };
  return {
    lat: typeof c.latitude === "number" ? c.latitude : typeof c.lat === "number" ? c.lat : 0,
    lng: typeof c.longitude === "number" ? c.longitude : typeof c.lng === "number" ? c.lng : 0,
  };
}

/** Firestore (GeoPoint, city string|objeto) → dominio (`{lat,lng}`, city objeto). Defensivo en transición. */
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

/** Dominio (`{lat,lng}`) → Firestore (GeoPoint). Mantiene la forma anidada uniforme. */
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

export class EventsFirebaseMapper implements IEventsMapper {
  toDomain(dto: FirebaseEventsDto): Events {
    return {
      id: dto.id,
      slug: dto.slug,
      title: dto.title,
      shortDescription: dto.shortDescription,
      description: dto.description,
      mainImage: dto.mainImage,
      media: dto.media,
      categoryInfo: dto.categoryInfo,
      author: dto.author,
      location: toDomainLocation(dto.location),
      status: dto.status,
      registrationType: dto.registrationType,
      externalUrl: dto.externalUrl,
      registrationEventForm: dto.registrationEventForm,
      capacity: dto.capacity,
      requiresAttendance: dto.requiresAttendance,
      price: dto.price,
      promotion: dto.promotion ? {
        isPromoted: dto.promotion.isPromoted ?? false,
        promotedAt: dto.promotion.promotedAt?.toDate ? dto.promotion.promotedAt.toDate() : undefined,
        promotedUntil: dto.promotion.promotedUntil?.toDate ? dto.promotion.promotedUntil.toDate() : undefined,
      } : {
        isPromoted: false,
        promotedAt: undefined,
        promotedUntil: undefined,
      },
      analytics: dto.analytics,
      eventType: dto.eventType,
      collaborators: dto.collaborators,
      collaboratorsData: dto.collaboratorsData
        ? Object.fromEntries(
            Object.entries(dto.collaboratorsData).map(([k, v]) => [
              k,
              { ...v, photoURL: v.photoURL ?? undefined },
            ]),
          )
        : undefined,
      startDate: dto.startDate?.toDate ? dto.startDate.toDate() : undefined,
      endDate: dto.endDate?.toDate ? dto.endDate.toDate() : undefined,
      createdAt: dto.createdAt?.toDate ? dto.createdAt.toDate() : new Date(),
      updatedAt: dto.updatedAt?.toDate ? dto.updatedAt.toDate() : new Date(),
      publishedAt: dto.publishedAt?.toDate ? dto.publishedAt.toDate() : undefined,
    } as unknown as Events;
  }

  /**
   * Garantiza analytics.score presente (default 0). Sin score, el evento queda
   * fuera de los listados: findAllEvents/... hacen orderBy("analytics.score"),
   * y Firestore excluye los docs que no tienen el campo del orderBy.
   */
  private withScore(analytics: Events["analytics"]) {
    return { ...(analytics ?? {}), score: analytics?.score ?? 0 };
  }

  /** promoción dominio → Firestore (Timestamps). Compartido entre standard y multi-date. */
  private toStoredPromotion(promotion: Events["promotion"]) {
    return promotion
      ? {
          isPromoted: promotion.isPromoted ?? false,
          promotedAt:
            promotion.promotedAt instanceof Date && !isNaN(promotion.promotedAt.getTime())
              ? Timestamp.fromDate(promotion.promotedAt)
              : undefined,
          promotedUntil:
            promotion.promotedUntil instanceof Date && !isNaN(promotion.promotedUntil.getTime())
              ? Timestamp.fromDate(promotion.promotedUntil)
              : undefined,
        }
      : { isPromoted: false, promotedAt: undefined, promotedUntil: undefined };
  }

  /**
   * Multi-fecha: el evento padre solo persiste el encabezado.
   * location/startDate/endDate/registro/precio viven en las sesiones.
   * Omite las claves (no undefined) y descarta undefined para no romper el write.
   */
  private toMultiDateHeaderDto(domain: Events): FirebaseEventsDto {
    const dto = {
      id: domain.id,
      slug: domain.slug,
      title: domain.title,
      shortDescription: domain.shortDescription,
      description: domain.description,
      mainImage: domain.mainImage,
      media: domain.media,
      categoryInfo: domain.categoryInfo,
      author: domain.author,
      status: domain.status,
      promotion: this.toStoredPromotion(domain.promotion),
      analytics: this.withScore(domain.analytics),
      eventType: domain.eventType,
      collaborators: domain.collaborators ?? [],
      collaboratorsData: domain.collaboratorsData ?? {},
      createdAt:
        domain.createdAt instanceof Date && !isNaN(domain.createdAt.getTime())
          ? Timestamp.fromDate(domain.createdAt)
          : Timestamp.now(),
      updatedAt:
        domain.updatedAt instanceof Date && !isNaN(domain.updatedAt.getTime())
          ? Timestamp.fromDate(domain.updatedAt)
          : Timestamp.now(),
      publishedAt:
        domain.publishedAt instanceof Date && !isNaN(domain.publishedAt.getTime())
          ? Timestamp.fromDate(domain.publishedAt)
          : undefined,
      metadata: {},
    };
    return Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    ) as unknown as FirebaseEventsDto;
  }

  toDto(domain: Events): FirebaseEventsDto {
    if (domain.eventType === "multi-date") {
      return this.toMultiDateHeaderDto(domain);
    }
    return {
      id: domain.id,
      slug: domain.slug,
      title: domain.title,
      shortDescription: domain.shortDescription,
      description: domain.description,
      mainImage: domain.mainImage,
      media: domain.media,
      categoryInfo: domain.categoryInfo,
      author: domain.author,
      location: toStoredLocation(domain.location),
      status: domain.status,
      registrationType: domain.registrationType,
      externalUrl: domain.externalUrl,
      registrationEventForm: domain.registrationEventForm,
      capacity: domain.capacity,
      requiresAttendance: domain.requiresAttendance,
      // Colaboradores: los persiste el owner con el save del evento (los edita en
      // el step del wizard). En el modelo account-level, aceptar una invitación NO
      // escribe en el evento, así que el owner es el único escritor → sin race.
      collaborators: domain.collaborators ?? [],
      collaboratorsData: domain.collaboratorsData ?? {},
      price: domain.price,
      promotion: domain.promotion ? {
        isPromoted: domain.promotion.isPromoted ?? false,
        promotedAt: domain.promotion.promotedAt instanceof Date && !isNaN(domain.promotion.promotedAt.getTime())
          ? Timestamp.fromDate(domain.promotion.promotedAt)
          : undefined,
        promotedUntil: domain.promotion.promotedUntil instanceof Date && !isNaN(domain.promotion.promotedUntil.getTime())
          ? Timestamp.fromDate(domain.promotion.promotedUntil)
          : undefined,
      } : {
        isPromoted: false,
        promotedAt: undefined,
        promotedUntil: undefined,
      },
      analytics: this.withScore(domain.analytics),
      startDate: domain.startDate instanceof Date && !isNaN(domain.startDate.getTime())
        ? Timestamp.fromDate(domain.startDate)
        : undefined,
      endDate: domain.endDate instanceof Date && !isNaN(domain.endDate.getTime())
        ? Timestamp.fromDate(domain.endDate)
        : undefined,
      createdAt: domain.createdAt instanceof Date && !isNaN(domain.createdAt.getTime())
        ? Timestamp.fromDate(domain.createdAt)
        : Timestamp.now(),
      updatedAt: domain.updatedAt instanceof Date && !isNaN(domain.updatedAt.getTime())
        ? Timestamp.fromDate(domain.updatedAt)
        : Timestamp.now(),
      publishedAt: domain.publishedAt instanceof Date && !isNaN(domain.publishedAt.getTime())
        ? Timestamp.fromDate(domain.publishedAt)
        : undefined,
      metadata: {},
    } as unknown as FirebaseEventsDto;
  }
}