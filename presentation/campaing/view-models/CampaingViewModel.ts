import { CTA } from "@/application/cta/types";
import { CampaignEntityType } from "@/domain/entities/campaign/CampaignEntityType";
import { CampaignStatus } from "@/domain/entities/campaign/CampaignStatus";
import { ImageVariants } from "@/domain/shared/ImageVariants";

export interface CampaignViewModel {
  id: string;
  title: string;
  description?: string;
  entityType: CampaignEntityType;
  status: CampaignStatus;
  priority: number;
  images: ImageVariants;
  isSponsored?: boolean;
  cta?: CTA[];
  entity?: {
    id: string;
    slug: string;
  };
  schedule?: {
    startAt: string;
    endAt: string;
  };
  analytics?: {
    views: number;
    clicks: number;
  };
  createdAt: string;
  updatedAt: string;
}
