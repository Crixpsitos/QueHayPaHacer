import { Metadata } from "next";
import { CampaignCarouselContainer } from "@/app/components/feature/home/campaign/CampaignCarouselContainer";
import { CampaignCarouselSkeleton } from "@/app/components/feature/home/campaign/CampaignCarouselSkeleton";
import { HomeSearchBar } from "@/app/components/feature/home/HomeSearchBar";
import Link from "next/link";
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
import { ActivityHomeBlock } from "@/presentation/activities/components/ActivityHomeBlock";
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
      {/* ponytail: h1 solo para lectores de pantalla y buscadores; el título visible lo pone el carrusel de campaña (h2, cambia por campaña) */}
      <h1 className="sr-only">Que Hay Pa Hacer? Eventos y planes en Ibagué: qué hacer hoy, este fin de semana y dónde ir</h1>
      <Suspense fallback={<CampaignCarouselSkeleton />}>
        <CampaignCarouselContainer />
      </Suspense>
      <Section spacing="sm" className="mt-4">
        <HomeSearchBar />
        {/* Enlaces internos a las landings que responden a "qué hacer hoy" / "este fin de semana" */}
        <nav aria-label="Atajos" className="mt-3 flex flex-wrap gap-2">
          {[
            { href: "/que-hay-hoy-ibague", label: "Qué hacer hoy" },
            { href: "/eventos-este-fin-de-semana-ibague", label: "Este fin de semana" },
            { href: "/actividades", label: "Actividades" },
            { href: "/donde-ir", label: "Dónde ir" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex min-h-10 items-center rounded-full border border-[#E4E4E7] bg-white px-4 text-sm font-medium text-[#09090B] transition-colors hover:bg-[#F4F4F5] focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </Section>
      <Suspense fallback={null}>
        <ActivityHomeBlock />
      </Suspense>
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
