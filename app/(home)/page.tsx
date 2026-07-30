import { Metadata } from "next";
import { CampaignCarouselContainer } from "@/app/components/feature/home/campaign/CampaignCarouselContainer";
import { CampaignCarouselSkeleton } from "@/app/components/feature/home/campaign/CampaignCarouselSkeleton";
import { ExploreSearchBar } from "@/app/components/feature/home/ExploreSearchBar";
import { Suspense } from "react";
import { CategoriesContainer } from "@/presentation/categories/components/CategoriesContainer";
import { CategoriesSkeleton } from "@/presentation/categories/components/CategoriesSkeleton";
import { HomeEventsRecomendationContainer } from "@/presentation/events/components/HomeEventsRecomendationContainer";
import { EventsSectionsSkeleton } from "@/presentation/events/components/EventsSectionsSkeleton";
import { PreferenceEventsContainer } from "@/presentation/events/components/PreferenceEventsContainer";
import { Section } from "@/app/components/layout/shared/Section";

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
        <ExploreSearchBar />
      </Section>
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesContainer />
      </Suspense>
      <Suspense fallback={<EventsSectionsSkeleton />}>
        <HomeEventsRecomendationContainer />
      </Suspense>
      <Suspense fallback={null}>
        <PreferenceEventsContainer />
      </Suspense>
    </>
  );
}
