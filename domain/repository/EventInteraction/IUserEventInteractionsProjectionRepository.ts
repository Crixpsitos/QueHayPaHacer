import type { DenormalizedEventData } from "./IEventInteractionsRepository";

export interface IUserEventInteractionsProjectionRepository {
  upsertLikeProjection(
    eventId: string,
    userId: string,
    liked: boolean,
    eventData: DenormalizedEventData,
  ): Promise<void>;

  /** Marca que la persona vio el evento (`viewedAt`); no hace nada si ya estaba marcada. No toca contadores. */
  recordViewProjection(eventId: string, userId: string): Promise<void>;

  upsertShareProjection(
    eventId: string,
    userId: string,
    eventData: DenormalizedEventData,
  ): Promise<void>;
}
