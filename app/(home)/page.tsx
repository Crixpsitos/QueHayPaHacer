import { Metadata } from "next";
import { CampaignCarouselContainer } from "@/app/components/feature/home/campaign/CampaignCarouselContainer";
import { CampaignCarouselSkeleton } from "@/app/components/feature/home/campaign/CampaignCarouselSkeleton";
import { Suspense } from "react";
import { CategoriesContainer } from "@/presentation/categories/components/CategoriesContainer";
import { CategoriesSkeleton } from "@/presentation/categories/components/CategoriesSkeleton";

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
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesContainer />
      </Suspense>
     
    </>
  );
}
