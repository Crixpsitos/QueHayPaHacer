import type { DenormalizedEventData } from "./IEventInteractionsRepository";

export interface IUserEventInteractionsProjectionRepository {
  upsertLikeProjection(
    eventId: string,
    userId: string,
    liked: boolean,
    eventData: DenormalizedEventData,
  ): Promise<void>;

  upsertShareProjection(
    eventId: string,
    userId: string,
    eventData: DenormalizedEventData,
  ): Promise<void>;
}
