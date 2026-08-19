import type { Timestamp } from "firebase-admin/firestore";
import type { FirebaseEventsDto } from "../events/FirebaseEventsDto";
import type { FirebaseUserDto } from "../FirebaseUserDto";

export interface FirebaseEventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: "pending" | "accepted" | "canceled";
  event: Partial<FirebaseEventsDto>;
  user: Partial<FirebaseUserDto>;
  registeredAt: Timestamp;

  formData?: Record<
    string,
    string | string[] | number | boolean | null | Record<string, unknown>
  >;
  qrCode: string;
  checkedInAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}