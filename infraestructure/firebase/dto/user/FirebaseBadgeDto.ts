import type { Timestamp } from "firebase-admin/firestore";
import type { BadgeCategory, BadgeCriteria } from "@/domain/entities/user/Badge";

/** Documento crudo de `badges/{id}` en Firestore. */
export interface FirebaseBadgeDto {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: BadgeCategory;
  criteria: BadgeCriteria;
  createdAt?: Timestamp;
  active: boolean;
}
