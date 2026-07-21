import type { FirebaseBadgeDto } from "@/infraestructure/firebase/dto/user/FirebaseBadgeDto";

/**
 * Puerto de infraestructura: devuelve DTOs crudos de Firestore. El mapeo
 * DTO → dominio vive en `BadgeAdapter` (vía `BadgeFirebaseMapper`).
 */
export interface IBadgeFirebaseRepository {
  getBadge(badgeId: string): Promise<FirebaseBadgeDto | null>;
  awardBadgeToUser(userId: string, badgeId: string, reason?: string): Promise<void>;
  userHasBadge(userId: string, badgeId: string): Promise<boolean>;
}
