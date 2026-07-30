import type { SiteInteraction } from "@/domain/entities/SiteInteraction/SiteInteraction";
import type { ISiteInteractionRepository } from "@/domain/repository/sites/ISiteInteractionRepository";
import type { ISiteInteractionFirebaseRepository } from "@/infraestructure/firebase/repositories/SiteInteraction/ISiteInteractionFirebaseRepository";
import type { SiteInteractionFirebaseMapper } from "@/infraestructure/firebase/mappers/SiteInteraction/SiteInteractionFirebaseMapper";

export class SiteInteractionAdapter implements ISiteInteractionRepository {
  constructor(
    private readonly repo: ISiteInteractionFirebaseRepository,
    private readonly mapper: SiteInteractionFirebaseMapper,
  ) {}

  async findBySiteAndUser(siteId: string, userId: string): Promise<SiteInteraction | null> {
    const dto = await this.repo.findBySiteAndUser(siteId, userId);
    return dto ? this.mapper.toDomain(dto) : null;
  }

  async findLikedByUser(siteIds: string[], userId: string): Promise<Record<string, boolean>> {
    return this.repo.findLikedByUser(siteIds, userId);
  }

  async registerLike(siteId: string, userId: string, liked: boolean): Promise<void> {
    await this.repo.registerLike(siteId, userId, liked);
  }

  async registerShare(siteId: string, userId: string): Promise<void> {
    await this.repo.registerShare(siteId, userId);
  }
}
