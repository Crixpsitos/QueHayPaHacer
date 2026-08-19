import type { SiteInteraction } from "@/domain/entities/SiteInteraction/SiteInteraction";
import type { FirebaseSiteInteractionDto } from "../../dto/SiteInteraction/FirebaseSiteInteractionDto";
import { Timestamp } from "firebase-admin/firestore";

export class SiteInteractionFirebaseMapper {
  toDomain(dto: FirebaseSiteInteractionDto): SiteInteraction {
    const toDate = (v: Timestamp | undefined): Date | undefined =>
      v instanceof Timestamp ? v.toDate() : undefined;

    const createdAt = toDate(dto.createdAt as Timestamp) ?? new Date();
    const updatedAt = toDate(dto.updatedAt as Timestamp) ?? createdAt;

    return {
      id: dto.id,
      siteId: dto.siteId,
      userId: dto.id, // document id = userId
      liked: dto.liked ?? false,
      likedAt: toDate(dto.likedAt),
      shareCount: dto.shareCount ?? 0,
      lastSharedAt: toDate(dto.lastSharedAt),
      createdAt,
      updatedAt,
    };
  }
}
