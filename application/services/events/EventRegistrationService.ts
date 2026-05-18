import type { EventRegistration } from "@/domain/entities/EventRegistration/EventRegistration";
import type { IEventRegistrationRepository } from "@/domain/repository/EventRegistration/IEventRegistrationRepository";

export class EventRegistrationService {
  constructor(
    private readonly eventRegistrationRepository: IEventRegistrationRepository,
  ) {}

  async getByEventIdAndUserId(
    eventId: string,
    userId: string,
  ): Promise<EventRegistration | null> {
    return this.eventRegistrationRepository.findByEventIdAndUserId(
      eventId,
      userId,
    );
  }
}
