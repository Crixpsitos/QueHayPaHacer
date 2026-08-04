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
    <Section
      className="overflow-hidden"
      containerClassName="w-full overflow-hidden rounded-xl aspect-video sm:aspect-[8/3]"
      spacing="sm"
    >
      <CampaignCarousel campaings={campaigns} />
    </Section>
  );
};
