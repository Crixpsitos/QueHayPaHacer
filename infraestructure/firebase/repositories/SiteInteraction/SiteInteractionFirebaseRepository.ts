import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import type { ISiteInteractionFirebaseRepository } from "./ISiteInteractionFirebaseRepository";
import type { FirebaseSiteInteractionDto } from "../../dto/SiteInteraction/FirebaseSiteInteractionDto";

export class SiteInteractionFirebaseRepository
  extends FirebaseBaseRepository
  implements ISiteInteractionFirebaseRepository
{
  protected readonly collectionName = "sites";

  constructor(db: Firestore) {
    super(db);
  }

  /** Interaction doc: sites/{siteId}/interactions/{userId} */
  private interactionDoc(siteId: string, userId: string) {
    return this.subCollection(siteId, "interactions").doc(userId);
  }

  /** Site doc reference for updating analytics counters */
  private siteDoc(siteId: string) {
    return this.collection.doc(siteId);
  }

  async findBySiteAndUser(
    siteId: string,
    userId: string,
  ): Promise<FirebaseSiteInteractionDto | null> {
    const doc = await this.interactionDoc(siteId, userId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as FirebaseSiteInteractionDto;
  }

  async findLikedByUser(siteIds: string[], userId: string): Promise<Record<string, boolean>> {
    if (siteIds.length === 0) return {};
    const results = await Promise.all(
      siteIds.map(async (siteId) => {
        const doc = await this.interactionDoc(siteId, userId).get();
        return { siteId, liked: doc.exists ? (doc.data()?.liked ?? false) : false };
      }),
    );
    return Object.fromEntries(results.map(({ siteId, liked }) => [siteId, liked as boolean]));
  }

  async registerLike(siteId: string, userId: string, liked: boolean): Promise<void> {
    const now = FieldValue.serverTimestamp();
    const interactionRef = this.interactionDoc(siteId, userId);
    const existing = await interactionRef.get();
    const wasLiked: boolean = existing.exists ? (existing.data()?.liked ?? false) : false;

    const payload: Record<string, unknown> = {
      siteId,
      liked,
      likedAt: now,
      updatedAt: now,
    };

    if (!existing.exists) {
      payload.shareCount = 0;
      payload.createdAt = now;
    }

    await interactionRef.set(payload, { merge: true });

    // Keep analytics.likes counter in sync
    const delta = liked && !wasLiked ? 1 : !liked && wasLiked ? -1 : 0;
    if (delta !== 0) {
      await this.siteDoc(siteId).update({
        "analytics.likes": FieldValue.increment(delta),
      });
    }
  }

  async registerShare(siteId: string, userId: string): Promise<void> {
    const now = FieldValue.serverTimestamp();
    const interactionRef = this.interactionDoc(siteId, userId);
    const existing = await interactionRef.get();

    const payload: Record<string, unknown> = {
      siteId,
      shareCount: FieldValue.increment(1),
      lastSharedAt: now,
      updatedAt: now,
    };

    if (!existing.exists) {
      payload.liked = false;
      payload.createdAt = now;
    }

    await interactionRef.set(payload, { merge: true });

    await this.siteDoc(siteId).update({
      "analytics.shares": FieldValue.increment(1),
    });
  }
}
