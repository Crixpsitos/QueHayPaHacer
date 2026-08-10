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
  async deleteEvent(id: string): Promise<void> {
    await this.collection.doc(id).delete();
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
          Filter.where("analytics.score", ">=", 15),
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

  async findPublishedBySiteId(siteId: string, limit = 8): Promise<FirebaseEventsDto[]> {
    const [standardSnap, multiDateSnap] = await Promise.all([
      this.collection
        .where("location.siteId", "==", siteId)
        .where("status", "==", "published")
        .orderBy("startDate", "desc")
        .limit(limit)
        .get(),
      this.collection
        .where("siteIds", "array-contains", siteId)
        .where("status", "==", "published")
        .orderBy("startDate", "desc")
        .limit(limit)
        .get(),
    ]);
    const seen = new Set<string>();
    const results: FirebaseEventsDto[] = [];
    for (const snap of [standardSnap, multiDateSnap]) {
      for (const d of snap.docs) {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          results.push({ id: d.id, ...d.data() } as FirebaseEventsDto);
        }
      }
    }
    return results.slice(0, limit);
  }

  async updateSiteIds(eventId: string, siteIds: string[]): Promise<void> {
    await this.collection.doc(eventId).update({ siteIds, updatedAt: FieldValue.serverTimestamp() });
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
    categorySlug: string | null,
    limit: number,
    cursor: string | null,
  ): Promise<{ ids: string[]; nextCursor: string | null }> {
    const now = new Date();
    const slug = categorySlug ?? categoryId;
    let query = this.collection
      .where("status", "==", "published")
      .where("categoryInfo.slug", "==", slug)
      .where("endDate", ">=", now)
      .orderBy("analytics.score", "desc");

    if (cursor) query = query.startAfter(Number(cursor));

    const snapshot = await query.limit(limit + 1).select("analytics.score").get();
    const docs = snapshot.docs;
    const page = docs.slice(0, limit);
    const nextCursor = docs.length > limit && page.length > 0
      ? String((page[page.length - 1].data() as { analytics?: { score?: number } }).analytics?.score ?? 0)
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
