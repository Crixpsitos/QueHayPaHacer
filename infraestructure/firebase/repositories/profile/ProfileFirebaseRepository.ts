import type { DocumentData, Firestore } from "firebase-admin/firestore";
import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import type { ProfileStats } from "@/domain/repository/profile/IProfileRepository";
import type { IProfileFirebaseRepository } from "./IProfileFirebaseRepository";
import type {
  FirestoreDoc,
  ProfileInteractionsRaw,
} from "@/infraestructure/firebase/dto/profile/FirebaseProfileDto";

export class ProfileFirebaseRepository
  extends FirebaseBaseRepository
  implements IProfileFirebaseRepository
{
  protected readonly collectionName = "users";

  constructor(db: Firestore, _enterpriseDb: unknown) {
    super(db);
    void _enterpriseDb;
  }

  async getStats(uid: string): Promise<ProfileStats> {
    const [
      eventsByAuthorId,
      eventsByAuthorUid,
      sitesByAuthorId,
      sitesByAuthorUid,
      badgesSnap,
    ] = await Promise.all([
      this.db.collection("events").where("author.id", "==", uid).count().get(),
      this.db.collection("events").where("author.uid", "==", uid).count().get(),
      this.db.collection("sites").where("author.id", "==", uid).count().get(),
      this.db.collection("sites").where("author.uid", "==", uid).count().get(),
      this.subCollection(uid, "badges").count().get(),
    ]);

    return {
      eventsCount: Math.max(
        eventsByAuthorId.data().count,
        eventsByAuthorUid.data().count,
      ),
      sitesCount: Math.max(
        sitesByAuthorId.data().count,
        sitesByAuthorUid.data().count,
      ),
      badgesCount: badgesSnap.data().count,
    };
  }

  async getUserEvents(uid: string, limit?: number): Promise<FirestoreDoc[]> {
    const byAuthorId = await this.getDocsByAuthorPath("events", "author.id", uid, limit);
    const byAuthorUid = byAuthorId.length
      ? []
      : await this.getDocsByAuthorPath("events", "author.uid", uid, limit);
    return [...byAuthorId, ...byAuthorUid];
  }

  async getUserSites(uid: string, limit?: number): Promise<FirestoreDoc[]> {
    const byAuthorId = await this.getDocsByAuthorPath("sites", "author.id", uid, limit);
    const byAuthorUid = byAuthorId.length
      ? []
      : await this.getDocsByAuthorPath("sites", "author.uid", uid, limit);
    return [...byAuthorId, ...byAuthorUid];
  }

  async getUserEventInteractions(uid: string, limit?: number): Promise<ProfileInteractionsRaw> {
    const interactionsCollection = this.subCollection(uid, "eventInteractions");

    let interactionsSnapshot;
    try {
      let query = interactionsCollection.orderBy("createdAt", "desc");
      if (limit) query = query.limit(limit);
      interactionsSnapshot = await query.get();
    } catch {
      const query = limit ? interactionsCollection.limit(limit) : interactionsCollection;
      interactionsSnapshot = await query.get();
    }

    const interactions: FirestoreDoc[] = interactionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    }));

    const uniqueEventIds = Array.from(
      new Set(
        interactions
          .map((doc) => (typeof doc.data.eventId === "string" ? (doc.data.eventId as string) : ""))
          .filter(Boolean),
      ),
    );

    const eventEntries = await Promise.all(
      uniqueEventIds.map(async (eventId) => {
        const eventDoc = await this.db.collection("events").doc(eventId).get();
        return [eventId, eventDoc.exists ? eventDoc.data() : undefined] as const;
      }),
    );

    const eventsById: Record<string, DocumentData> = {};
    for (const [eventId, data] of eventEntries) {
      if (data) eventsById[eventId] = data;
    }

    const uniqueAuthorIds = Array.from(
      new Set(
        Object.values(eventsById)
          .map((event) => {
            const author = event.author as { id?: unknown; uid?: unknown } | undefined;
            return typeof author?.id === "string"
              ? author.id
              : typeof author?.uid === "string"
                ? author.uid
                : "";
          })
          .filter(Boolean),
      ),
    );
    const authorDocs = uniqueAuthorIds.length
      ? await this.db.getAll(...uniqueAuthorIds.map((authorId) => this.db.collection("users").doc(authorId)))
      : [];
    const authorsById: Record<string, DocumentData> = {};
    for (const authorDoc of authorDocs) {
      if (authorDoc.exists) authorsById[authorDoc.id] = authorDoc.data() ?? {};
    }

    return { interactions, eventsById, authorsById };
  }

  async getUserBadges(uid: string, limit?: number): Promise<FirestoreDoc[]> {
    let query = this.subCollection(uid, "badges").orderBy("earnedAt", "desc");
    if (limit) query = query.limit(limit);
    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  }

  private async getDocsByAuthorPath(
    collection: "events" | "sites",
    path: "author.id" | "author.uid",
    uid: string,
    limit?: number,
  ): Promise<FirestoreDoc[]> {
    let withOrderQuery = this.db
      .collection(collection)
      .where(path, "==", uid)
      .orderBy("createdAt", "desc");
    let noOrderQuery = this.db.collection(collection).where(path, "==", uid);
    if (limit) {
      withOrderQuery = withOrderQuery.limit(limit);
      noOrderQuery = noOrderQuery.limit(limit);
    }

    let snapshot;
    try {
      snapshot = await withOrderQuery.get();
    } catch {
      snapshot = await noOrderQuery.get();
    }

    return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  }
}
