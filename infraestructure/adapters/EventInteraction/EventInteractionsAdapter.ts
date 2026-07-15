import type { EventInteractions } from "@/domain/entities/EventInteractions/EventInteractions";
import type { IEventInteractionsRepository } from "@/domain/repository/EventInteraction/IEventInteractionsRepository";
import type { IEventInteractionsMapper } from "@/infraestructure/firebase/mappers/EventInteraction/IEventInteractionsMapper";
import type { IEventInteractionsFirebaseRepository } from "@/infraestructure/firebase/repositories/EventInteraction/IEventInteractionsFirebaseRepository";

export class EventInteractionsAdapter implements IEventInteractionsRepository {
  constructor(
    private readonly repository: IEventInteractionsFirebaseRepository,
    private readonly mapper: IEventInteractionsMapper,
  ) {}

  async findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<EventInteractions | null> {
    const dto = await this.repository.findByEventAndUser(eventId, userId);
    if (!dto) return null;
    return this.mapper.toDomain(dto);
  }

  async createLikeInteraction(
    eventId: string,
    userId: string,
    liked: boolean,
    eventData: any,
  ): Promise<void> {
    await this.repository.createLikeInteraction(eventId, userId, liked, eventData);
  }

  async createClickInteraction(eventId: string, userId: string, eventData: any): Promise<void> {
    await this.repository.createClickInteraction(eventId, userId, eventData);
  }

  async createRegistrationInteraction(
    eventId: string,
    userId: string,
    eventData: any,
  ): Promise<void> {
    await this.repository.createRegistrationInteraction(eventId, userId, eventData);
  }

  async createShareInteraction(eventId: string, userId: string, eventData: any): Promise<void> {
    await this.repository.createShareInteraction(eventId, userId, eventData);
  }
}
