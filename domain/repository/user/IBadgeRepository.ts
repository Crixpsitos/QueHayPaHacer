import type { Badge } from "@/domain/entities/user/Badge";

export interface IBadgeRepository {
  // Obtener catálogo de insignias
  getBadge(badgeId: string): Promise<Badge | null>;
  
  // Asignar insignia a usuario
  awardBadgeToUser(
    userId: string,
    badgeId: string,
    reason?: string
  ): Promise<void>;
  
  // Verificar si usuario ya tiene insignia
  userHasBadge(userId: string, badgeId: string): Promise<boolean>;
}
