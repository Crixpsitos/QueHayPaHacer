import { FieldPath, FieldValue, Filter, Timestamp, type Firestore } from "firebase-admin/firestore";
import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import type { IEventsFirebaseRepository } from "./IEventsFirebaseRepository";
import { FirebaseEventsDto } from "../../dto/events/FirebaseEventsDto";

export class EventsFirebaseRepository
  extends FirebaseBaseRepository
  implements IEventsFirebaseRepository
{
  protected readonly collectionName = "events";

  constructor(db: Firestore) {
    super(db);
  }
  async updateEvent(event: FirebaseEventsDto): Promise<void> {
    await this.collection.doc(event.id).set(event, { merge: true });
  }
  async updateEventDateRange(
    eventId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    // Merge dirigido: solo startDate/endDate. Evita el toDto multi-date (que
    // omite fechas) y no pisa promotion/createdAt/metadata.
    await this.collection.doc(eventId).set(
      {
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
  async createEvent(event: FirebaseEventsDto): Promise<FirebaseEventsDto> {
    const documentReference = await this.collection.add(event);
    const id = documentReference.id
    return { ...event, id };
    
  }
  async findDraftEventByIdAndUser(id: string, userId: string): Promise<FirebaseEventsDto | null> {
    const snapshot = await this.collection
      .where("status", "==", "draft")
      .where("author.id", "==", userId)
      .where("id", "==", id)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as FirebaseEventsDto;
  }
  async findLastDraftEventToUser(userId: string): Promise<FirebaseEventsDto | null> {
    const snapshot = await this.collection
      .where("status", "==", "draft")
      .where("author.id", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as FirebaseEventsDto;
  }
  async createDraftEvent(event: FirebaseEventsDto): Promise<FirebaseEventsDto> {
    const idRef = this.collection.doc();

    const now = FieldValue.serverTimestamp() as unknown as Timestamp;

    await idRef.set({
      ...event,
      id: idRef.id,
      createdAt: now,
      updatedAt: now,
    });
    return {...event, id: idRef.id, createdAt: now, updatedAt: now, };
  }
  async findFeaturedEvents(): Promise<string[]> {
    const now = new Date();
    const snapshot = await this.collection
      .where("status", "==", "published")
      .where("endDate", ">=", now)
      .where(
        Filter.or(
          Filter.and(
            Filter.where("promotion.isPromoted", "==", true),
            Filter.where("promotion.promotedUntil", ">=", now),
          ),
          // ponytail: umbral bajo para MVP. Con pocos eventos, el score máx es
          // ~37, así que 55 dejaba "destacados" siempre vacío. Subir con volumen real.
          Filter.where("analytics.score", ">=", 20),
        ),
      )
      .select()
      .limit(10)
      .get();

    return snapshot.docs.map((doc) => doc.id);
  }

  async findWeekendEvents(): Promise<string[]> {
    const now = new Date();

    const endOfWeek = new Date(now);

    const daysUntilSunday = (7 - now.getDay()) % 7;

    endOfWeek.setDate(now.getDate() + daysUntilSunday);

    endOfWeek.setHours(23, 59, 59, 999);

    const snapshot = await this.collection
      .where("status", "==", "published")
      .where("endDate", ">=", now)
      .where("startDate", "<=", endOfWeek)
      .orderBy("analytics.score", "desc")
      .limit(20)
      .select()
      .get();

    return snapshot.docs.map((doc) => doc.id);
  }

  async incrementLikes(eventId: string, delta: number): Promise<void> {
    await this.collection.doc(eventId).update({
      "analytics.likes": FieldValue.increment(delta),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  async incrementShares(eventId: string, delta: number): Promise<void> {
    await this.collection.doc(eventId).update({
      "analytics.shares": FieldValue.increment(delta),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  async findById(id: string): Promise<FirebaseEventsDto | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() } as FirebaseEventsDto;
  }

  async findBySlug(slug: string): Promise<FirebaseEventsDto | null> {
    const snapshot = await this.collection
      .where("slug", "==", slug)
      .where("status", "==", "published")
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as FirebaseEventsDto;
  }

  async findByTopCategory(categoryIds: string[]): Promise<string[]> {
    if (categoryIds.length === 0) {
      return [];
    }

    const now = new Date();
    const snapshot = await this.collection
      .where("status", "==", "published")
      .where("categoryInfo.id", "in", categoryIds)
      .where("startDate", ">=", now)
      .orderBy("analytics.score", "desc")
      .limit(20)
      .select()
      .get();

    return snapshot.docs.map((doc) => doc.id);
  }

  async findByCategoryPaginated(
    categoryId: string,
    limit: number,
    cursor: string | null,
  ): Promise<{ ids: string[]; nextCursor: string | null }> {
    const now = new Date();
    let query = this.collection
      .where("status", "==", "published")
      .where("categoryInfo.id", "==", categoryId)
      .where("startDate", ">=", now)
      .orderBy("analytics.score", "desc")
      // Tiebreaker por documentId → cursor estable sin índice extra (ver score con ties).
      .orderBy(FieldPath.documentId(), "desc");

    if (cursor) {
      const sep = cursor.indexOf("|");
      const score = Number(cursor.slice(0, sep));
      const id = cursor.slice(sep + 1);
      query = query.startAfter(score, id);
    }

    // limit+1 para saber si hay más sin una query extra.
    const snapshot = await query.limit(limit + 1).select("analytics.score").get();
    const docs = snapshot.docs;
    const hasMore = docs.length > limit;
    const page = docs.slice(0, limit);
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? `${(last.data() as { analytics?: { score?: number } }).analytics?.score ?? 0}|${last.id}`
        : null;

    return { ids: page.map((d) => d.id), nextCursor };
  }

  async findAllEvents(): Promise<string[]> {
    const now = new Date();
    const snapshot = await this.collection
      .where("status", "==", "published")
      .where("endDate", ">=", now)
      .orderBy("analytics.score", "desc")
      .limit(30)
      .select()
      .get();

    return snapshot.docs.map((doc) => doc.id);
  }
}
