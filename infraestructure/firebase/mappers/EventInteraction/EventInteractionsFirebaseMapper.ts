import { Timestamp } from "firebase-admin/firestore";

import type { EventInteractions } from "@/domain/entities/EventInteractions/EventInteractions";
import type { Events } from "@/domain/entities/events/Events";
import type { FirebaseEventInteractionDto, DenormalizedEventFirebaseData } from "@/infraestructure/firebase/dto/EventInteraction/FirebaseEventInteractionDto";

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
      share: dto.share ?? 0,
      sharedAt: dto.sharedAt?.toDate(),
      event: (dto.event as unknown as Events) ?? ({} as Events),
      createdAt,
      updatedAt,
    };
  }

  toDto(domain: EventInteractions): FirebaseEventInteractionDto {
    return {
      id: domain.id,
      eventId: domain.eventId,
      liked: domain.liked,
      likedAt: domain.likedAt ? Timestamp.fromDate(domain.likedAt) : undefined,
      viewedAt: domain.viewedAt ? Timestamp.fromDate(domain.viewedAt) : undefined,
      clickCount: domain.clickCount,
      registeredAt: domain.registeredAt ? Timestamp.fromDate(domain.registeredAt) : undefined,
      share: domain.share,
      sharedAt: domain.sharedAt ? Timestamp.fromDate(domain.sharedAt) : undefined,
      event: domain.event as unknown as DenormalizedEventFirebaseData,
      createdAt: Timestamp.fromDate(domain.createdAt),
      updatedAt: Timestamp.fromDate(domain.updatedAt),
    };
  }
}
