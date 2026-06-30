import type { IBadgeRepository } from "@/domain/repository/user/IBadgeRepository";

export class BadgeService {
  constructor(private badgeRepository: IBadgeRepository) {}

  async awardBadgeToUser(
    userId: string,
    badgeId: string,
    reason?: string
  ): Promise<void> {
    // Verificar si el usuario ya tiene la insignia
    const alreadyHas = await this.badgeRepository.userHasBadge(
      userId,
      badgeId
    );
    if (alreadyHas) {
      return;
    }

    // Asignar la insignia
    await this.badgeRepository.awardBadgeToUser(userId, badgeId, reason);
  }

  async userHasBadge(userId: string, badgeId: string): Promise<boolean> {
    return this.badgeRepository.userHasBadge(userId, badgeId);
  }
}
