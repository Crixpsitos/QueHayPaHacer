import type { Campaign } from "@/domain/entities/campaign/Campaign";
import type { CampaignViewModel } from "../view-models/CampaingViewModel";

export class CampaignViewModelMapper {
  static toViewModel(
    campaign: Campaign
  ): CampaignViewModel {


    return {
      id: campaign.id,

      title: campaign.title,

      description: campaign.description,

      entityType: campaign.entityType,

      status: campaign.status,

      priority: campaign.priority,

      images: campaign.images,

      isSponsored: campaign.isSponsored,

      cta: campaign.cta,

      entity: campaign.entity
        ? {
            id: campaign.entity.id,
            slug: campaign.entity.slug,
          }
        : undefined,

      schedule: campaign.schedule
        ? {
            startAt: new Date(
              campaign.schedule.startAt
            ).toISOString(),

            endAt: new Date(
              campaign.schedule.endAt
            ).toISOString(),
          }
        : undefined,

      analytics: campaign.analytics
        ? {
            views: campaign.analytics.views,
            clicks: campaign.analytics.clicks,
          }
        : undefined,

      createdAt:
        campaign.createdAt.toISOString(),

      updatedAt:
        campaign.updatedAt.toISOString(),
    };
  }

  static toViewModels(
    campaigns: Campaign[]
  ): CampaignViewModel[] {
    return campaigns.map((campaign) =>
      this.toViewModel(campaign)
    );
  }
}