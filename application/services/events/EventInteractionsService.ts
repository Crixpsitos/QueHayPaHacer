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
  ): Promise<EventInteractions | null> {
    return this.eventInteractionsRepository.findByEventAndUser(eventId, userId);
  }

  /**
   * Like del EVENTO. No existe like por sesión a propósito: el like es el estado
   * de una persona (el doc de interacción es su uid), así que un like al evento
   * y otro a su fecha contarían a la misma persona dos veces e inflarían el
   * score. Lo que sí es por sesión son las ACCIONES: vista, registro y share.
   */
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

  /**
   * Share del evento o de una de sus fechas (`sessionId`). A diferencia del
   * like, un share es una ACCIÓN: compartir el evento y compartir una fecha son
   * dos enlaces distintos repartidos, así que contar ambos no duplica nada.
   */
  async registerShare(eventId: string, userId: string, sessionId?: string): Promise<void> {
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

    // El contador va donde ocurrió el share; el score del padre lo recoge por
    // el agregado `analytics.sessionShares` que calcula la Cloud Function.
    if (sessionId) {
      await this.eventSessionRepository.incrementCounter(eventId, sessionId, "shares", 1);
    } else {
      await this.eventsRepository.incrementShares(eventId, 1);
    }
  }
}
