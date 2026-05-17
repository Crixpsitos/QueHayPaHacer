import { FieldValue, Filter, type Firestore } from "firebase-admin/firestore";
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
}
