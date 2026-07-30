import type { FirebaseSiteInteractionDto } from "../../dto/SiteInteraction/FirebaseSiteInteractionDto";

export interface ISiteInteractionFirebaseRepository {
  findBySiteAndUser(siteId: string, userId: string): Promise<FirebaseSiteInteractionDto | null>;
  findLikedByUser(siteIds: string[], userId: string): Promise<Record<string, boolean>>;
  registerLike(siteId: string, userId: string, liked: boolean): Promise<void>;
  registerShare(siteId: string, userId: string): Promise<void>;
}
