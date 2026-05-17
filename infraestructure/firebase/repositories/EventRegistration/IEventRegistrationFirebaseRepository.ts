import type { FirebaseEventRegistration } from "@/infraestructure/firebase/dto/EventRegistration/FirebaseEventRegistration";

export interface IEventRegistrationFirebaseRepository {
  findByEventIdAndUserId(
    eventId: string,
    userId: string,
  ): Promise<FirebaseEventRegistration | null>;
}
