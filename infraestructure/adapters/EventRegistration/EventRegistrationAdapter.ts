import { Timestamp } from "firebase-admin/firestore";

import type { EventRegistration } from "@/domain/entities/EventRegistration/EventRegistration";
import type { IEventRegistrationRepository, RegisterEventInput } from "@/domain/repository/EventRegistration/IEventRegistrationRepository";
import type { IEventRegistrationMapper } from "@/infraestructure/firebase/mappers/EventRegistration/IEventRegistrationMapper";
import type { IEventRegistrationFirebaseRepository } from "@/infraestructure/firebase/repositories/EventRegistration/IEventRegistrationFirebaseRepository";

export class EventRegistrationAdapter implements IEventRegistrationRepository {
  constructor(
    private readonly repository: IEventRegistrationFirebaseRepository,
    private readonly mapper: IEventRegistrationMapper,
  ) {}

  async findByEventIdAndUserId(
    eventId: string,
    userId: string,
  ): Promise<EventRegistration | null> {
    const dto = await this.repository.findByEventIdAndUserId(eventId, userId);
    if (!dto) return null;
    return this.mapper.toDomain(dto);
  }

  async isUserRegistered(eventId: string, userId: string): Promise<boolean> {
    const entry = await this.repository.findEntryByEventIdAndUserId(eventId, userId);
    return entry !== null;
  }

  async registerUserToEvent(input: RegisterEventInput): Promise<void> {
    await this.repository.registerUserToEvent(input.eventId, {
      userId: input.userId,
      eventId: input.eventId,
      parentType: "events",
      name: input.name,
      email: input.email,
      registeredAt: Timestamp.now(),
      registrationType: input.registrationType,
      status: "registered",
      ...(input.formData ? { formData: input.formData } : {}),
    });
  }
}
