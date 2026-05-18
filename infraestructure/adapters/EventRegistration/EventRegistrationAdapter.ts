import type { EventRegistration } from "@/domain/entities/EventRegistration/EventRegistration";
import type { IEventRegistrationRepository } from "@/domain/repository/EventRegistration/IEventRegistrationRepository";
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
}
