import { Timestamp } from 'firebase-admin/firestore';

export interface FirebaseCategoryScore {
  score: number;
  interactionCount: number;
  slug: string;
  title: string;
  lastInteractionAt: Timestamp;
}

export interface FirebaseUserPreferencesDto {
  userId: string;
  categories: Record<string, FirebaseCategoryScore>;
  updatedAt: Timestamp;
}
