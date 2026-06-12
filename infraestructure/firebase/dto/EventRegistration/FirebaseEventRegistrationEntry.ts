import type { Timestamp } from "firebase-admin/firestore";

/**
 * Lightweight DTO stored in the subcollection:
 *   events/{eventId}/registrations/{userId}
 *
 * Using userId as the document ID guarantees one registration per user per event
 * and makes "is the user registered?" a simple doc.get() — no query needed.
 *
 * Extra fields and their future utility:
 *   - status: lets the organizer move registrations to "waitlist" / "accepted" / "canceled"
 *   - eventId: denormalized so we can query "all events a user registered for" from a collectionGroup
 *   - registrationType: lets the organizer know how the user registered (internal vs form)
 *   - formData: stores custom form answers for form-type events
 */
export interface FirebaseEventRegistrationEntry {
  userId: string;
  eventId: string;
  name: string;
  email: string;
  registeredAt: Timestamp;
  registrationType: "internal" | "form";
  status: "registered" | "waitlist" | "accepted" | "canceled";
  formData?: Record<string, string | string[] | number | boolean | null | Record<string, unknown>>;
}
