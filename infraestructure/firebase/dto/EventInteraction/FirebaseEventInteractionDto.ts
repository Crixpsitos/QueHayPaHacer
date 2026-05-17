import type { Timestamp } from "firebase-admin/firestore";
import { FirebaseEventsDto } from "../events/FirebaseEventsDto";

export interface FirebaseEventInteractionDto {
  id: string;
  eventId: string;
  liked?: boolean;
  event?: Partial<FirebaseEventsDto>;
  likedAt?: Timestamp;
  viewedAt?: Timestamp;
  clickCount?: number;
  registeredAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}