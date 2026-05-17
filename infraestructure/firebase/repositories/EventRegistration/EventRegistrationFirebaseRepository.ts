import { type Firestore } from "firebase-admin/firestore";

import type { FirebaseEventRegistration } from "@/infraestructure/firebase/dto/EventRegistration/FirebaseEventRegistration";

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
}
