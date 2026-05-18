import type { Timestamp } from "firebase-admin/firestore";
import { FirebaseEventsDto } from "../events/FirebaseEventsDto";

export interface DenormalizedEventFirebaseData {
  id: string;
  title: string;
  slug: string;
  images?: { desktop?: string };
  categoryInfo?: { id: string; title: string; slug: string };
}

export interface FirebaseEventInteractionDto {
  id: string;
  eventId: string;
  event?: DenormalizedEventFirebaseData;
  liked?: boolean;
  likedAt?: Timestamp;
  viewedAt?: Timestamp;
  clickCount?: number;
  registeredAt?: Timestamp;
  share?: number;
  sharedAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}