import type { Timestamp } from "firebase-admin/firestore";
import type { ImageVariants } from "@/domain/shared/ImageVariants";
import type { CampaignEntityType } from "@/domain/entities/campaign/CampaignEntityType";
import type { CampaignStatus } from "@/domain/entities/campaign/CampaignStatus";

export interface FirebaseCampaignDto {
  id: string;
  title: string;
  description?: string;
  entityType: CampaignEntityType;
  status: CampaignStatus;
  priority: number;
  images: ImageVariants;
  isSponsored?: boolean;
  cta?: {
    label: string;
    href: string;
  }[];
  entity?: {
    id: string;
    slug: string;
  };
  schedule?: {
    startAt: Timestamp;
    endAt: Timestamp;
  };
  analytics?: {
    views: number;
    clicks: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
