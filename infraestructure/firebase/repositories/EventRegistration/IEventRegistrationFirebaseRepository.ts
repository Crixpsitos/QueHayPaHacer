import type { FirebaseEventRegistration } from "@/infraestructure/firebase/dto/EventRegistration/FirebaseEventRegistration";
import type { CancelRegistrationResult, CheckInCodeResult, UserRegistrationItem } from "@/domain/repository/EventRegistration/IEventRegistrationRepository";
import type { FirebaseEventRegistrationEntry } from "@/infraestructure/firebase/dto/EventRegistration/FirebaseEventRegistrationEntry";

export interface IEventRegistrationFirebaseRepository {
  findByEventIdAndUserId(
    eventId: string,
    userId: string,
    sessionId?: string,
  ): Promise<FirebaseEventRegistration | null>;

  findEntryByEventIdAndUserId(
    eventId: string,
    userId: string,
    sessionId?: string,
  ): Promise<FirebaseEventRegistrationEntry | null>;

  registerUserToEvent(
    eventId: string,
    entry: FirebaseEventRegistrationEntry,
    sessionId?: string,
  ): Promise<void>;

  listByUserId(userId: string, limit?: number): Promise<UserRegistrationItem[]>;

  getOrCreateCheckInCode(eventId: string, userId: string, sessionId?: string): Promise<CheckInCodeResult>;

  cancelRegistration(
    eventId: string,
    userId: string,
    sessionId?: string,
  ): Promise<CancelRegistrationResult>;
}
