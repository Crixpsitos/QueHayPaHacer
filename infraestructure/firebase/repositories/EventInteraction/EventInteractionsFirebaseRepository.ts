import { FieldValue, type Firestore } from "firebase-admin/firestore";

import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import { IEventInteractionsFirebaseRepository } from "./IEventInteractionsFirebaseRepository";
import { FirebaseEventInteractionDto } from "../../dto/EventInteraction/FirebaseEventInteractionDto";

export class EventInteractionsFirebaseRepository
  extends FirebaseBaseRepository
  implements IEventInteractionsFirebaseRepository
{
  protected collectionName: string = "events";

  constructor(db: Firestore) {
    super(db);
  }

  async findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<FirebaseEventInteractionDto | null> {
    const doc = await this.subCollection(eventId, "interactions").doc(userId).get();
    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as FirebaseEventInteractionDto;
  }

  async createLikeInteraction(
    eventId: string,
    userId: string,
    liked: boolean,
  ): Promise<void> {
    const eventInteractionRef = this.subCollection(eventId, "interactions").doc(userId);

    const payload = {
      id: userId,
      eventId,
      userId,
      liked,
      likedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await eventInteractionRef.set(payload, { merge: true });
  }

  async createClickInteraction(eventId: string, userId: string): Promise<void> {
    await this.subCollection(eventId, "interactions").doc(userId).set(
      {
        id: userId,
        eventId,
        userId,
        viewedAt: FieldValue.serverTimestamp(),
        clickCount: FieldValue.increment(1),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  async createRegistrationInteraction(
    eventId: string,
    userId: string,
  ): Promise<void> {
    await this.subCollection(eventId, "interactions").doc(userId).set(
      {
        id: userId,
        eventId,
        userId,
        registeredAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
}
