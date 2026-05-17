import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type { IUserEventInteractionsProjectionRepository } from "@/domain/repository/EventInteraction/IUserEventInteractionsProjectionRepository";

export class UserEventInteractionsProjectionFirebaseRepository
  implements IUserEventInteractionsProjectionRepository
{
  constructor(private readonly db: Firestore) {}

  async upsertLikeProjection(
    eventId: string,
    userId: string,
    liked: boolean,
  ): Promise<void> {
    await this.db
      .collection("users")
      .doc(userId)
      .collection("eventInteractions")
      .doc(eventId)
      .set(
        {
          id: userId,
          eventId,
          userId,
          liked,
          likedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
  }
}
