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
      images: dto.images,
      categoryInfo: dto.categoryInfo,
      author: dto.author,
      location: dto.location,
      status: dto.status,
      registrationType: dto.registrationType,
      externalUrl: dto.externalUrl,
      capacity: dto.capacity,
      price: dto.price,
      promotion: {
        isPromoted: dto.promotion.isPromoted,
        promotedAt: dto.promotion.promotedAt.toDate(),
        promotedUntil: dto.promotion.promotedUntil.toDate(),
      },
      analytics: dto.analytics,
      startDate: dto.startDate.toDate(),
      endDate: dto.endDate.toDate(),
      createdAt: dto.createdAt.toDate(),
      updatedAt: dto.updatedAt.toDate(),
      publishedAt: dto.publishedAt?.toDate(),
    };
  }

  toDto(domain: Events): FirebaseEventsDto {
    return {
      id: domain.id,
      slug: domain.slug,
      title: domain.title,
      shortDescription: domain.shortDescription,
      description: domain.description,
      images: domain.images,
      categoryInfo: domain.categoryInfo,
      author: domain.author,
      location: domain.location,
      status: domain.status,
      registrationType: domain.registrationType,
      externalUrl: domain.externalUrl,
      capacity: domain.capacity,
      price: domain.price,
      promotion: {
        isPromoted: domain.promotion.isPromoted,
        promotedAt: Timestamp.fromDate(domain.promotion.promotedAt),
        promotedUntil: Timestamp.fromDate(domain.promotion.promotedUntil),
      },
      analytics: domain.analytics,
      startDate: Timestamp.fromDate(domain.startDate),
      endDate: Timestamp.fromDate(domain.endDate),
      createdAt: Timestamp.fromDate(domain.createdAt),
      updatedAt: Timestamp.fromDate(domain.updatedAt),
      publishedAt: domain.publishedAt
        ? Timestamp.fromDate(domain.publishedAt)
        : undefined,
      metadata: {},
    };
  }
}
