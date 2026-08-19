import type { ISiteInteractionRepository } from "@/domain/repository/sites/ISiteInteractionRepository";
import type { SiteInteraction } from "@/domain/entities/SiteInteraction/SiteInteraction";

export class SiteInteractionService {
  constructor(private readonly repository: ISiteInteractionRepository) {}

  async findLikedByUser(siteIds: string[], userId: string): Promise<Record<string, boolean>> {
    if (!userId?.trim() || siteIds.length === 0) return {};
    return this.repository.findLikedByUser(siteIds, userId);
  }

  async getByUserAndSite(siteId: string, userId: string): Promise<SiteInteraction | null> {
    return this.repository.findBySiteAndUser(siteId, userId);
  }

  async registerLike(siteId: string, userId: string, liked: boolean): Promise<void> {
    if (!siteId?.trim() || !userId?.trim()) {
      throw new Error("siteId y userId son requeridos.");
    }
    await this.repository.registerLike(siteId, userId, liked);
  }

  async registerShare(siteId: string, userId: string): Promise<void> {
    if (!siteId?.trim() || !userId?.trim()) {
      throw new Error("siteId y userId son requeridos.");
    }
    await this.repository.registerShare(siteId, userId);
  }
}
