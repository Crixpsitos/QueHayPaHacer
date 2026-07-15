import type { EventInteractions } from "@/domain/entities/EventInteractions/EventInteractions";
import type { ImageVariants } from "@/domain/shared/ImageVariants";

export interface DenormalizedEventData {
  id: string;
  title: string;
  slug: string;
  images?: ImageVariants;
  categoryInfo?: { id: string; title: string; slug: string };
}

export interface IEventInteractionsRepository {
  findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<EventInteractions | null>;
  createLikeInteraction(
    eventId: string,
    userId: string,
    liked: boolean,
    eventData: DenormalizedEventData,
  ): Promise<void>;
  createClickInteraction(eventId: string, userId: string, eventData: DenormalizedEventData): Promise<void>;
  createRegistrationInteraction(eventId: string, userId: string, eventData: DenormalizedEventData): Promise<void>;
  createShareInteraction(eventId: string, userId: string, eventData: DenormalizedEventData): Promise<void>;
}
