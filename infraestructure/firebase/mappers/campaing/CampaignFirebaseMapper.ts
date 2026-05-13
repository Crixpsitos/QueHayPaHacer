import { Timestamp } from "firebase-admin/firestore";

import type { Campaign } from "@/domain/entities/campaign/Campaign";

import type { CTA } from "@/application/cta/types";
import { ICampaignMapper } from "./ICampaingMapper";
import { FirebaseCampaignDto } from "@/infraestructure/firebase/dto/FirebaseCampaignDto";

export class CampaignFirebaseMapper implements ICampaignMapper {
  toDto(domain: Campaign): FirebaseCampaignDto {
    return {
      id: domain.id,

      title: domain.title,

      description: domain.description,

      entityType: domain.entityType,

      status: domain.status,

      priority: domain.priority,

      images: domain.images,

      isSponsored: domain.isSponsored,

      cta: domain.cta as
        | {
            label: string;
            href: string;
          }[]
        | undefined,

      entity: domain.entity,

      schedule: domain.schedule
        ? {
            startAt: Timestamp.fromDate(domain.schedule.startAt),

            endAt: Timestamp.fromDate(domain.schedule.endAt),
          }
        : undefined,

      analytics: domain.analytics,

      createdAt: Timestamp.fromDate(domain.createdAt),

      updatedAt: Timestamp.fromDate(domain.updatedAt),
    };
  }
  toDomain(dto: FirebaseCampaignDto): Campaign {
    return {
      id: dto.id,

      title: dto.title,

      description: dto.description,

      entityType: dto.entityType,

      status: dto.status,

      priority: dto.priority,

      images: dto.images,

      isSponsored: dto.isSponsored,

      cta: dto.cta as CTA[] | undefined,

      entity: dto.entity,

      schedule: dto.schedule
        ? {
            startAt: dto.schedule.startAt.toDate(),

            endAt: dto.schedule.endAt.toDate(),
          }
        : undefined,

      analytics: dto.analytics,

      createdAt: dto.createdAt.toDate(),

      updatedAt: dto.updatedAt.toDate(),
    };
  }
}
