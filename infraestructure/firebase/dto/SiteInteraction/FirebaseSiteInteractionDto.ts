import type { FieldValue, Timestamp } from "firebase-admin/firestore";

export interface FirebaseSiteInteractionDto {
  id: string;
  siteId: string;
  liked: boolean;
  likedAt?: Timestamp;
  shareCount: number;
  lastSharedAt?: Timestamp;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}
