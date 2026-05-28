import { FieldValue, Filter, Timestamp, type Firestore } from "firebase-admin/firestore";
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
  async findFeaturedEvents(): Promise<FirebaseEventsDto[]> {
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
          Filter.where("analytics.score", ">=", 55),
        ),
      )
      .limit(10)
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as FirebaseEventsDto,
    );
  }

  async findWeekendEvents(): Promise<FirebaseEventsDto[]> {
    const now = new Date();

    const endOfWeek = new Date(now);

    const daysUntilSunday = (7 - now.getDay()) % 7;

    endOfWeek.setDate(now.getDate() + daysUntilSunday);

    endOfWeek.setHours(23, 59, 59, 999);

    const snapshot = await this.collection
      .where("status", "==", "published")
      .where("endDate", ">=", now)
      .where("startDate", "<=", endOfWeek)
      .orderBy("startDate", "asc")
      .limit(20)
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as FirebaseEventsDto,
    );
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

  async findByTopCategory(categoryIds: string[]): Promise<FirebaseEventsDto[]> {
    if (categoryIds.length === 0) {
      return [];
    }

    const now = new Date();
    const snapshot = await this.collection
      .where("status", "==", "published")
      .where("categoryInfo.id", "in", categoryIds)
      .where("startDate", ">=", now)
      .orderBy("startDate", "asc")
      .limit(20)
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as FirebaseEventsDto,
    );
  }

  async findAllEvents(): Promise<FirebaseEventsDto[]> {
    const now = new Date();
    const snapshot = await this.collection
      .where("status", "==", "published")
      .where("endDate", ">=", now)
      .orderBy("startDate", "asc")
      .limit(30)
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as FirebaseEventsDto,
    );
  }
}
