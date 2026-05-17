import { Timestamp } from "firebase-admin/firestore";

import type { EventInteractions } from "@/domain/entities/EventInteractions/EventInteractions";
import type { Events } from "@/domain/entities/events/Events";
import type { FirebaseEventInteractionDto } from "@/infraestructure/firebase/dto/EventInteraction/FirebaseEventInteractionDto";

import type { IEventInteractionsMapper } from "./IEventInteractionsMapper";

export class EventInteractionsFirebaseMapper
  implements IEventInteractionsMapper
{
  toDomain(dto: FirebaseEventInteractionDto): EventInteractions {
    const createdAt = dto.createdAt?.toDate() ?? new Date();
    const updatedAt = dto.updatedAt?.toDate() ?? createdAt;
    const likedAt = dto.likedAt?.toDate() ?? updatedAt;

    return {
      id: dto.id,
      eventId: dto.eventId,
      liked: dto.liked ?? false,
      likedAt,
      viewedAt: dto.viewedAt?.toDate() ?? likedAt,
      clickCount: dto.clickCount ?? 0,
      registeredAt: dto.registeredAt?.toDate() ?? likedAt,
      event: (dto.event ?? {}) as unknown as Events,
      createdAt,
      updatedAt,
    };
  }

  toDto(domain: EventInteractions): FirebaseEventInteractionDto {
    return {
      id: domain.id,
      eventId: domain.eventId,
      liked: domain.liked,
      likedAt: Timestamp.fromDate(domain.likedAt),
      viewedAt: Timestamp.fromDate(domain.viewedAt),
      clickCount: domain.clickCount,
      registeredAt: Timestamp.fromDate(domain.registeredAt),
      event: domain.event as unknown as Partial<
        import("@/infraestructure/firebase/dto/events/FirebaseEventsDto").FirebaseEventsDto
      >,
      createdAt: Timestamp.fromDate(domain.createdAt),
      updatedAt: Timestamp.fromDate(domain.updatedAt),
    };
  }
}
