import { Metadata } from "next";
import { CampaignCarouselContainer } from "@/app/components/feature/home/campaign/CampaignCarouselContainer";
import { CampaignCarouselSkeleton } from "@/app/components/feature/home/campaign/CampaignCarouselSkeleton";
import { Suspense } from "react";
import { CategoriesContainer } from "@/presentation/categories/components/CategoriesContainer";
import { CategoriesSkeleton } from "@/presentation/categories/components/CategoriesSkeleton";
import { HomeEventsRecomendationContainer } from "@/presentation/events/components/HomeEventsRecomendationContainer";
import { EventsSectionsSkeleton } from "@/presentation/events/components/EventsSectionsSkeleton";

export const metadata: Metadata = {
  // absolute: evita que el template del root duplique la marca.
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
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesContainer />
      </Suspense>
      <Suspense fallback={<EventsSectionsSkeleton />}>
        <HomeEventsRecomendationContainer />
      </Suspense>
     
    </>
  );
}
