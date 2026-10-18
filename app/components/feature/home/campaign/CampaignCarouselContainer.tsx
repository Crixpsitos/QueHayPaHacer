import { Section } from "@/app/components/layout/shared/Section";
import { CampaignCarousel } from "./CampaignCarousel";
import { CampaignSlide } from "./CampaignSlide";
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

const DAY_MS = 86_400_000;

// "Hasta el 20 de oct" solo si la campaña termina en los próximos 14 días.
const endsLabel = (endAt?: string) => {
  const end = endAt ? new Date(endAt).getTime() : NaN;
  const left = end - Date.now();
  if (!(left > 0 && left <= 14 * DAY_MS)) return undefined;
  return `Hasta el ${new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "America/Bogota" }).format(end).replace(".", "")}`;
};

export const CampaignCarouselContainer = async () => {
  "use cache";
  cacheLife("hours");
  cacheTag("active-campaigns");
  const campaigns = await fetchActiveCampaigns();

  if (campaigns.length === 0) return null;

  const slides = campaigns.map((campaign, i) => ({
    id: campaign.id,
    node: <CampaignSlide campaign={campaign} priority={i === 0} endsLabel={endsLabel(campaign.schedule?.endAt)} />,
  }));

  return (
    <div className="overflow-hidden py-6 sm:py-8">
      {/* Margen de página → div externo; rounded-3xl solo en el wrapper interno sin padding */}
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="w-full overflow-hidden rounded-3xl shadow-card aspect-video sm:aspect-[8/3]">
          <CampaignCarousel slides={slides} />
        </div>
      </div>
    </div>
  );
};
