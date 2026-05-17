import type { EventInteractions } from "@/domain/entities/EventInteractions/EventInteractions";
import type { IEventInteractionsRepository } from "@/domain/repository/EventInteraction/IEventInteractionsRepository";
import type { IUserEventInteractionsProjectionRepository } from "@/domain/repository/EventInteraction/IUserEventInteractionsProjectionRepository";
import type { IEventsRepository } from "@/domain/repository/events/IEventsRepository";

export class EventInteractionsService {
  constructor(
    private readonly eventInteractionsRepository: IEventInteractionsRepository,
    private readonly userEventInteractionsProjectionRepository: IUserEventInteractionsProjectionRepository,
    private readonly eventsRepository: IEventsRepository,
  ) {}

  async getByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<EventInteractions | null> {
    return this.eventInteractionsRepository.findByEventAndUser(eventId, userId);
  }

  async registerLike(
    eventId: string,
    userId: string,
    liked: boolean,
  ): Promise<void> {
    const currentInteraction = await this.eventInteractionsRepository.findByEventAndUser(
      eventId,
      userId,
    );
    const previousLiked = currentInteraction?.liked ?? false;

    await this.eventInteractionsRepository.createLikeInteraction(
      eventId,
      userId,
      liked,
    );

    await this.userEventInteractionsProjectionRepository.upsertLikeProjection(
      eventId,
      userId,
      liked,
    );

    const likesDelta = previousLiked === liked ? 0 : liked ? 1 : -1;
    if (likesDelta !== 0) {
      await this.eventsRepository.incrementLikes(eventId, likesDelta);
    }
  }

  async registerClick(eventId: string, userId: string): Promise<void> {
    await this.eventInteractionsRepository.createClickInteraction(eventId, userId);
  }

  async registerRegistration(eventId: string, userId: string): Promise<void> {
    await this.eventInteractionsRepository.createRegistrationInteraction(
      eventId,
      userId,
    );
  }
}
