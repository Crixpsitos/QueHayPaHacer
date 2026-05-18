import type { EventInteractions } from "@/domain/entities/EventInteractions/EventInteractions";
import type { IEventInteractionsRepository, DenormalizedEventData } from "@/domain/repository/EventInteraction/IEventInteractionsRepository";
import type { IUserEventInteractionsProjectionRepository } from "@/domain/repository/EventInteraction/IUserEventInteractionsProjectionRepository";
import type { IEventsRepository } from "@/domain/repository/events/IEventsRepository";
import type { Events } from "@/domain/entities/events/Events";

const extractEventData = (event: Events): DenormalizedEventData => ({
  id: event.id,
  title: event.title,
  slug: event.slug,
  images: event.images ? event.images : undefined,
  categoryInfo: event.categoryInfo ? { 
    id: event.categoryInfo.id, 
    title: event.categoryInfo.title,
    slug: event.categoryInfo.slug,
  } : undefined,
});

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

    const event = await this.eventsRepository.findById(eventId);
    const eventData = event ? extractEventData(event) : { id: eventId, title: "", slug: "" };

    await this.eventInteractionsRepository.createLikeInteraction(
      eventId,
      userId,
      liked,
      eventData,
    );

    await this.userEventInteractionsProjectionRepository.upsertLikeProjection(
      eventId,
      userId,
      liked,
      eventData,
    );

    const likesDelta = previousLiked === liked ? 0 : liked ? 1 : -1;
    if (likesDelta !== 0) {
      await this.eventsRepository.incrementLikes(eventId, likesDelta);
    }
  }

  async registerClick(eventId: string, userId: string): Promise<void> {
    const event = await this.eventsRepository.findById(eventId);
    const eventData = event ? extractEventData(event) : { id: eventId, title: "", slug: "" };
    await this.eventInteractionsRepository.createClickInteraction(eventId, userId, eventData);
  }

  async registerRegistration(eventId: string, userId: string): Promise<void> {
    const event = await this.eventsRepository.findById(eventId);
    const eventData = event ? extractEventData(event) : { id: eventId, title: "", slug: "" };
    await this.eventInteractionsRepository.createRegistrationInteraction(
      eventId,
      userId,
      eventData,
    );
  }

  async registerShare(eventId: string, userId: string): Promise<void> {
    const event = await this.eventsRepository.findById(eventId);
    const eventData = event ? extractEventData(event) : { id: eventId, title: "", slug: "" };
    
    await this.eventInteractionsRepository.createShareInteraction(
      eventId,
      userId,
      eventData,
    );

    await this.eventsRepository.incrementShares(eventId, 1);
  }
}
