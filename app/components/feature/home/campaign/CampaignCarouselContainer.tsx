import { Section } from "@/app/components/layout/shared/Section";
import { CampaignCarousel } from "./CampaignCarousel";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";
import { CampaignViewModelMapper } from "@/presentation/campaing/mapper/CampaignViewModelMapper";

const fetchActiveCampaigns = async () => {
  "use cache";
  cacheLife({
    stale: 120,
    revalidate: 60,
    expire: 120,
  }); 
  cacheTag("active-campaigns");

  const { campaignService } = createServerContainer();

  const campaignsDomain = await campaignService.getActiveCampaigns();

  const campaigns = CampaignViewModelMapper.toViewModels(campaignsDomain);


  return campaigns;
};

export const CampaignCarouselContainer = async () => {
  const campaigns = await fetchActiveCampaigns();

  return (
    <Section
      className="overflow-hidden"
      containerClassName="w-full overflow-hidden rounded-xl aspect-[8/3]"
      spacing="sm"
    >
      <CampaignCarousel campaings={campaigns} />
    </Section>
  );
};
