import { Section } from "@/app/components/layout/shared/Section";
import { CampaignCarousel } from "./CampaignCarousel";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";

const fetchActiveCampaigns = async () => {
  "use cache";
  cacheLife({
    expire: 120,
    revalidate: 60,
  });
  cacheTag("active-campaigns");

  const { campaignService } = createServerContainer();

  return await campaignService.getActiveCampaigns();
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
