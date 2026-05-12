import { CTA } from "@/application/cta/types";
import type { CampaignEntityType } from "./CampaignEntityType";
import type { CampaignStatus } from "./CampaignStatus";
import type { ImageVariants } from "@/domain/shared/ImageVariants";

export interface Campaign {
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
  createdAt: Date;
  updatedAt: Date;
}
