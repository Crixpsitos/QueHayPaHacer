import type { EventRegistration } from "@/domain/entities/EventRegistration/EventRegistration";

export interface IEventRegistrationRepository {
  findByEventIdAndUserId(
    eventId: string,
    userId: string,
  ): Promise<EventRegistration | null>;
}
