import { Metadata } from "next";
import { CampaignCarouselContainer } from "@/app/components/feature/home/campaign/CampaignCarouselContainer";
import { CampaignCarouselSkeleton } from "@/app/components/feature/home/campaign/CampaignCarouselSkeleton";
import { HomeSearchBar } from "@/app/components/feature/home/HomeSearchBar";
import { Suspense } from "react";
import { CategoriesContainer } from "@/presentation/categories/components/CategoriesContainer";
import { CategoriesSkeleton } from "@/presentation/categories/components/CategoriesSkeleton";
import { HomeEventsRecomendationContainer } from "@/presentation/events/components/HomeEventsRecomendationContainer";
import { EventsSectionsSkeleton } from "@/presentation/events/components/EventsSectionsSkeleton";
import { PreferenceEventsContainer } from "@/presentation/events/components/PreferenceEventsContainer";
import { Section } from "@/app/components/layout/shared/Section";
import { CreatorVerificationBanner } from "@/app/components/feature/home/CreatorVerificationBanner";
import { ContributionBanner } from "@/app/components/feature/home/ContributionBanner";
import { VerifiedCreatorsSection } from "@/app/components/feature/home/VerifiedCreatorsSection";
import { PremiumBanner } from "@/app/components/feature/home/PremiumBanner";

export const metadata: Metadata = {
  title: { absolute: "Que Hay Pa Hacer? — Eventos y planes en Ibagué" },
  description:
    "Descubre eventos y planes en Ibagué: conciertos, cultura, gastronomía, deporte y más. Encuentra qué hay pa' hacer cerca de ti.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<CampaignCarouselSkeleton />}>
        <CampaignCarouselContainer />
      </Suspense>
      <Section spacing="sm" className="mt-4">
        <HomeSearchBar />
      </Section>
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesContainer />
      </Suspense>
      <ContributionBanner />
      <Suspense fallback={<EventsSectionsSkeleton />}>
        <HomeEventsRecomendationContainer />
      </Suspense>
      <PreferenceEventsContainer />
      <PremiumBanner />
      <CreatorVerificationBanner />
      <VerifiedCreatorsSection />
    </>
  );
}
