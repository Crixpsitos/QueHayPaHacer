import type { EventRegistration } from "@/domain/entities/EventRegistration/EventRegistration";
import type { IEventRegistrationRepository, RegisterEventInput } from "@/domain/repository/EventRegistration/IEventRegistrationRepository";

export class EventRegistrationService {
  constructor(
    private readonly eventRegistrationRepository: IEventRegistrationRepository,
  ) {}

  async getByEventIdAndUserId(
    eventId: string,
    userId: string,
    sessionId?: string,
  ): Promise<EventRegistration | null> {
    return this.eventRegistrationRepository.findByEventIdAndUserId(
      eventId,
      userId,
      sessionId,
    );
  }

  async isUserRegistered(eventId: string, userId: string, sessionId?: string): Promise<boolean> {
    return this.eventRegistrationRepository.isUserRegistered(eventId, userId, sessionId);
  }

  async registerUserToEvent(input: RegisterEventInput): Promise<void> {
    return this.eventRegistrationRepository.registerUserToEvent(input);
  }
}
