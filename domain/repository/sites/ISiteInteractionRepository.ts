import type { SiteInteraction } from "@/domain/entities/SiteInteraction/SiteInteraction";

export interface ISiteInteractionRepository {
  findBySiteAndUser(siteId: string, userId: string): Promise<SiteInteraction | null>;
  findLikedByUser(siteIds: string[], userId: string): Promise<Record<string, boolean>>;
  registerLike(siteId: string, userId: string, liked: boolean): Promise<void>;
  registerShare(siteId: string, userId: string): Promise<void>;
}
