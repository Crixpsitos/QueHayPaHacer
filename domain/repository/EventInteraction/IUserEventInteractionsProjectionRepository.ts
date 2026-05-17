export interface IUserEventInteractionsProjectionRepository {
  upsertLikeProjection(
    eventId: string,
    userId: string,
    liked: boolean,
  ): Promise<void>;
}
