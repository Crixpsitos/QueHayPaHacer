import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type { IUserEventInteractionsProjectionRepository } from "@/domain/repository/EventInteraction/IUserEventInteractionsProjectionRepository";
import type { DenormalizedEventData } from "@/domain/repository/EventInteraction/IEventInteractionsRepository";
import type { DenormalizedEventFirebaseData } from "@/infraestructure/firebase/dto/EventInteraction/FirebaseEventInteractionDto";

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

export class UserEventInteractionsProjectionFirebaseRepository
  implements IUserEventInteractionsProjectionRepository
{
  constructor(private readonly db: Firestore) {}

  async upsertLikeProjection(
    eventId: string,
    userId: string,
    liked: boolean,
    eventData: DenormalizedEventData,
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
          event: cleanUndefined(eventData as unknown as DenormalizedEventFirebaseData),
          liked,
          likedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
  }

  async upsertShareProjection(
    eventId: string,
    userId: string,
    eventData: DenormalizedEventData,
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
          event: cleanUndefined(eventData as unknown as DenormalizedEventFirebaseData),
          share: FieldValue.increment(1),
          sharedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
  }
}
