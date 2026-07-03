import { Timestamp } from "firebase-admin/firestore";
import { Events } from "@/domain/entities/events/Events";
import { FirebaseEventsDto } from "../../dto/events/FirebaseEventsDto";
import { IEventsMapper } from "./IEventsMapper";

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
      location: dto.location,
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
      startDate: dto.startDate?.toDate ? dto.startDate.toDate() : undefined,
      endDate: dto.endDate?.toDate ? dto.endDate.toDate() : undefined,
      createdAt: dto.createdAt?.toDate ? dto.createdAt.toDate() : new Date(),
      updatedAt: dto.updatedAt?.toDate ? dto.updatedAt.toDate() : new Date(),
      publishedAt: dto.publishedAt?.toDate ? dto.publishedAt.toDate() : undefined,
    } as unknown as Events;
  }

  toDto(domain: Events): FirebaseEventsDto {
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
      location: domain.location,
      status: domain.status,
      registrationType: domain.registrationType,
      externalUrl: domain.externalUrl,
      registrationEventForm: domain.registrationEventForm,
      capacity: domain.capacity,
      requiresAttendance: domain.requiresAttendance,
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
      analytics: domain.analytics,
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