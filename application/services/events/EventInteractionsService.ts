import type { EventInteractions } from "@/domain/entities/EventInteractions/EventInteractions";
import type { IEventInteractionsRepository, DenormalizedEventData } from "@/domain/repository/EventInteraction/IEventInteractionsRepository";
import type { IUserEventInteractionsProjectionRepository } from "@/domain/repository/EventInteraction/IUserEventInteractionsProjectionRepository";
import type { IEventsRepository } from "@/domain/repository/events/IEventsRepository";
import type { IEventSessionRepository } from "@/domain/repository/events/IEventSessionRepository";
import type { Events } from "@/domain/entities/events/Events";

const extractEventData = (event: Events): DenormalizedEventData => ({
  id: event.id,
  title: event.title,
  slug: event.slug,
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
    private readonly eventSessionRepository: IEventSessionRepository,
  ) {}

  async getByEventAndUser(
    eventId: string,
    userId: string,
    sessionId?: string,
  ): Promise<EventInteractions | null> {
    return this.eventInteractionsRepository.findByEventAndUser(eventId, userId, sessionId);
  }

  async registerLike(
    eventId: string,
    userId: string,
    liked: boolean,
    sessionId?: string,
  ): Promise<void> {
    const currentInteraction = await this.eventInteractionsRepository.findByEventAndUser(
      eventId,
      userId,
      sessionId,
    );
    const previousLiked = currentInteraction?.liked ?? false;

    const event = await this.eventsRepository.findById(eventId);
    const eventData = event ? extractEventData(event) : { id: eventId, title: "", slug: "" };

    await this.eventInteractionsRepository.createLikeInteraction(
      eventId,
      userId,
      liked,
      eventData,
      sessionId,
    );

    // La proyección de perfil ("mis likes") solo aplica a likes de evento por ahora.
    if (!sessionId) {
      await this.userEventInteractionsProjectionRepository.upsertLikeProjection(
        eventId,
        userId,
        liked,
        eventData,
      );
    }

    const likesDelta = previousLiked === liked ? 0 : liked ? 1 : -1;
    if (likesDelta !== 0) {
      if (sessionId) {
        await this.eventSessionRepository.incrementCounter(eventId, sessionId, "likes", likesDelta);
      } else {
        await this.eventsRepository.incrementLikes(eventId, likesDelta);
      }
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

    await this.userEventInteractionsProjectionRepository.upsertShareProjection(
      eventId,
      userId,
      eventData,
    );

    await this.eventsRepository.incrementShares(eventId, 1);
  }
}
