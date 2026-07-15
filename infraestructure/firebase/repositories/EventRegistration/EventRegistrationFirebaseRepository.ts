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

  /**
   * Colección de registros. Si `sessionId`, apunta a la subcolección de la
   * sesión: events/{eventId}/sessions/{sessionId}/registrations.
   */
  private registrationsCol(eventId: string, sessionId?: string) {
    if (!sessionId) return this.subCollection(eventId, "registrations");
    return this.subCollection(eventId, "sessions")
      .doc(sessionId)
      .collection("registrations");
  }

  async findByEventIdAndUserId(
    eventId: string,
    userId: string,
    sessionId?: string,
  ): Promise<FirebaseEventRegistration | null> {
    const snapshot = await this.registrationsCol(eventId, sessionId)
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
    sessionId?: string,
  ): Promise<FirebaseEventRegistrationEntry | null> {
    const doc = await this.registrationsCol(eventId, sessionId)
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
    sessionId?: string,
  ): Promise<void> {
    const batch = this.db.batch();

    const regRef = this.registrationsCol(eventId, sessionId).doc(entry.userId);
    batch.set(regRef, entry, { merge: false });

    // Incrementa el contador en la sesión o en el evento según corresponda.
    const targetRef = sessionId
      ? this.subCollection(eventId, "sessions").doc(sessionId)
      : this.collection.doc(eventId);
    batch.set(
      targetRef,
      {
        analytics: { registrations: FieldValue.increment(1) },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await batch.commit();
  }
}
