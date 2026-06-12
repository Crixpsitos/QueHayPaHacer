import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type { FirebaseEventRegistration } from "@/infraestructure/firebase/dto/EventRegistration/FirebaseEventRegistration";
import type { FirebaseEventRegistrationEntry } from "@/infraestructure/firebase/dto/EventRegistration/FirebaseEventRegistrationEntry";

import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import { IEventRegistrationFirebaseRepository } from "./IEventRegistrationFirebaseRepository";

export class EventRegistrationFirebaseRepository
  extends FirebaseBaseRepository
  implements IEventRegistrationFirebaseRepository
{
  protected collectionName: string = "events";

  constructor(db: Firestore) {
    super(db);
  }

  async findByEventIdAndUserId(
    eventId: string,
    userId: string,
  ): Promise<FirebaseEventRegistration | null> {
    const snapshot = await this.subCollection(eventId, "registrations")
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as FirebaseEventRegistration;
  }

  /**
   * Reads the lightweight entry stored at events/{eventId}/registrations/{userId}.
   * O(1) — direct doc lookup, no query.
   */
  async findEntryByEventIdAndUserId(
    eventId: string,
    userId: string,
  ): Promise<FirebaseEventRegistrationEntry | null> {
    const doc = await this.subCollection(eventId, "registrations")
      .doc(userId)
      .get();

    if (!doc.exists) return null;
    return doc.data() as FirebaseEventRegistrationEntry;
  }

  /**
   * Writes the registration entry using userId as document ID.
   * Idempotent — calling twice overwrites with the same data.
   * Also increments analytics.registrations on the parent event document.
   */
  async registerUserToEvent(
    eventId: string,
    entry: FirebaseEventRegistrationEntry,
  ): Promise<void> {
    const batch = this.db.batch();

    const regRef = this.subCollection(eventId, "registrations").doc(entry.userId);
    batch.set(regRef, entry, { merge: false });

    const eventRef = this.collection.doc(eventId);
    batch.update(eventRef, {
      "analytics.registrations": FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
  }
}
