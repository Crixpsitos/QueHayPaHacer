import { Metadata } from "next";
import { CampaignCarouselContainer } from "@/app/components/feature/home/campaign/CampaignCarouselContainer";
import { CampaignCarouselSkeleton } from "@/app/components/feature/home/campaign/CampaignCarouselSkeleton";
import { Suspense } from "react";

export const metadata: Metadata  = {
  title: "Que Hay Pa Hacer?",
  description:
    "Una plataforma para descubrir eventos y actividades en tu ciudad.",
};

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<CampaignCarouselSkeleton />}>
        <CampaignCarouselContainer />
      </Suspense>
    </>
  );
}
