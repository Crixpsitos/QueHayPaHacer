import type { Badge } from "@/domain/entities/user/Badge";
import type { IBadgeRepository } from "@/domain/repository/user/IBadgeRepository";
import type { IBadgeFirebaseRepository } from "@/infraestructure/firebase/repositories/user/IBadgeFirebaseRepository";
import type { BadgeFirebaseMapper } from "@/infraestructure/firebase/mappers/user/BadgeFirebaseMapper";

/** Puerto de dominio: envuelve el repo Firebase y mapea DTO → dominio. */
export class BadgeAdapter implements IBadgeRepository {
  constructor(
    private readonly repository: IBadgeFirebaseRepository,
    private readonly mapper: BadgeFirebaseMapper,
  ) {}

  async getBadge(badgeId: string): Promise<Badge | null> {
    const dto = await this.repository.getBadge(badgeId);
    return dto ? this.mapper.toDomain(dto) : null;
  }

  awardBadgeToUser(userId: string, badgeId: string, reason?: string): Promise<void> {
    return this.repository.awardBadgeToUser(userId, badgeId, reason);
  }

  userHasBadge(userId: string, badgeId: string): Promise<boolean> {
    return this.repository.userHasBadge(userId, badgeId);
  }
}
