import { Timestamp } from "firebase-admin/firestore";
import type { Campaign } from "@/domain/entities/campaign/Campaign";
import type { FirebaseCampaignDto } from "@/infraestructure/firebase/dto/FirebaseCampaignDto";
import type { CTA } from "@/application/cta/types";

export class CampaignFirebaseMapper {
  static toDomain(dto: FirebaseCampaignDto): Campaign {
    return {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      entityType: dto.entityType,
      status: dto.status,
      priority: dto.priority,
      images: dto.images,
      isSponsored: dto.isSponsored,
      cta: dto.cta as unknown as CTA[] | undefined,
      entity: dto.entity,
      schedule: dto.schedule
        ? {
            startAt: dto.schedule.startAt instanceof Timestamp 
              ? dto.schedule.startAt.toDate().toISOString()
              : String(dto.schedule.startAt),
            endAt: dto.schedule.endAt instanceof Timestamp 
              ? dto.schedule.endAt.toDate().toISOString()
              : String(dto.schedule.endAt),
          }
        : undefined,
      analytics: dto.analytics,
      createdAt: dto.createdAt instanceof Timestamp 
        ? dto.createdAt.toDate()
        : new Date(dto.createdAt as unknown as string | number),
      updatedAt: dto.updatedAt instanceof Timestamp 
        ? dto.updatedAt.toDate()
        : new Date(dto.updatedAt as unknown as string | number),
    };
  }

  static toDto(domain: Campaign): FirebaseCampaignDto {
    return {
      id: domain.id,
      title: domain.title,
      description: domain.description,
      entityType: domain.entityType,
      status: domain.status,
      priority: domain.priority,
      images: domain.images,
      isSponsored: domain.isSponsored,
      cta: domain.cta as unknown as { label: string; href: string }[] | undefined,
      entity: domain.entity,
      schedule: domain.schedule
        ? {
            startAt: Timestamp.fromDate(new Date(domain.schedule.startAt)),
            endAt: Timestamp.fromDate(new Date(domain.schedule.endAt)),
          }
        : undefined,
      analytics: domain.analytics,
      createdAt: domain.createdAt instanceof Date
        ? Timestamp.fromDate(domain.createdAt)
        : Timestamp.fromDate(new Date(domain.createdAt as unknown as string | number)),
      updatedAt: domain.updatedAt instanceof Date
        ? Timestamp.fromDate(domain.updatedAt)
        : Timestamp.fromDate(new Date(domain.updatedAt as unknown as string | number)),
    };
  }
}
