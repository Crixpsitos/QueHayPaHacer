import { Section } from "@/app/components/layout/shared/Section";
import { CampaignCarousel } from "./CampaignCarousel";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";
import { CampaignViewModelMapper } from "@/presentation/campaing/mapper/CampaignViewModelMapper";

const fetchActiveCampaigns = async () => {
  "use cache";
  cacheLife("hours");
  cacheTag("active-campaigns");

  const { campaignService } = createServerContainer();

  const campaignsDomain = await campaignService.getActiveCampaigns();

  const campaigns = CampaignViewModelMapper.toViewModels(campaignsDomain);


  return campaigns;
};

export const CampaignCarouselContainer = async () => {
  "use cache";
  cacheLife("hours");
  cacheTag("active-campaigns");
  const campaigns = await fetchActiveCampaigns();

  return (
    <div className="overflow-hidden py-6 sm:py-8">
      {/* Margen de página → div externo; rounded-3xl solo en el wrapper interno sin padding */}
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="w-full overflow-hidden rounded-3xl shadow-card aspect-video sm:aspect-[8/3]">
          <CampaignCarousel campaings={campaigns} />
        </div>
      </div>
    </div>
  );
};
