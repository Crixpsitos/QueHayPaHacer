import { FieldValue, type Firestore } from "firebase-admin/firestore";

import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import { IEventInteractionsFirebaseRepository } from "./IEventInteractionsFirebaseRepository";
import { DenormalizedEventFirebaseData, FirebaseEventInteractionDto } from "../../dto/EventInteraction/FirebaseEventInteractionDto";

/**
 * Elimina propiedades undefined de un objeto DenormalizedEventFirebaseData
 * Necesario porque Firestore no permite valores undefined
 */
function cleanUndefined(
  obj: DenormalizedEventFirebaseData | undefined | null,
): Partial<DenormalizedEventFirebaseData> | undefined {
  if (obj === null || obj === undefined) return undefined;
  
  const cleaned: Partial<DenormalizedEventFirebaseData> = {};
  
  if (obj.id !== undefined) cleaned.id = obj.id;
  if (obj.title !== undefined) cleaned.title = obj.title;
  if (obj.slug !== undefined) cleaned.slug = obj.slug;
  
  if (obj.images !== undefined) {
    cleaned.images = {};
    if (obj.images.desktop !== undefined) {
      cleaned.images.desktop = obj.images.desktop;
    }
  }
  
  if (obj.categoryInfo !== undefined) {
    cleaned.categoryInfo = {
      id: obj.categoryInfo.id,
      title: obj.categoryInfo.title,
      slug: obj.categoryInfo.slug,
    };
  }
  
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

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
    eventData: DenormalizedEventFirebaseData,
  ): Promise<void> {
    const eventInteractionRef = this.subCollection(eventId, "interactions").doc(userId);

    const payload = {
      id: userId,
      eventId,
      userId,
      event: cleanUndefined(eventData),
      liked,
      likedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await eventInteractionRef.set(payload, { merge: true });
  }

  async createClickInteraction(eventId: string, userId: string, eventData: DenormalizedEventFirebaseData): Promise<void> {
    await this.subCollection(eventId, "interactions").doc(userId).set(
      {
        id: userId,
        eventId,
        userId,
        event: cleanUndefined(eventData),
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
    eventData: DenormalizedEventFirebaseData,
  ): Promise<void> {
    await this.subCollection(eventId, "interactions").doc(userId).set(
      {
        id: userId,
        eventId,
        userId,
        event: cleanUndefined(eventData),
        registeredAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  async createShareInteraction(eventId: string, userId: string, eventData: DenormalizedEventFirebaseData): Promise<void> {
    await this.subCollection(eventId, "interactions").doc(userId).set(
      {
        id: userId,
        eventId,
        userId,
        event: cleanUndefined(eventData),
        sharedAt: FieldValue.serverTimestamp(),
        share: FieldValue.increment(1),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
}
