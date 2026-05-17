import type { EventInteractions } from "@/domain/entities/EventInteractions/EventInteractions";

export interface IEventInteractionsRepository {
  findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<EventInteractions | null>;
  createLikeInteraction(
    eventId: string,
    userId: string,
    liked: boolean,
  ): Promise<void>;
  createClickInteraction(eventId: string, userId: string): Promise<void>;
  createRegistrationInteraction(eventId: string, userId: string): Promise<void>;
}
