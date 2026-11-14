import { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/app/components/layout/shared/Section";
import { CreatorVerificationBanner } from "@/app/components/feature/home/CreatorVerificationBanner";
import { ContributionBanner } from "@/app/components/feature/home/ContributionBanner";
import { VerifiedCreatorsSection } from "@/app/components/feature/home/VerifiedCreatorsSection";
import { PremiumBanner } from "@/app/components/feature/home/PremiumBanner";
import { CategoriesContainer } from "@/presentation/categories/components/CategoriesContainer";
import { PreferenceEventsContainer } from "@/presentation/events/components/PreferenceEventsContainer";
import { fetchHomeView } from "@/presentation/home/data/fetchHomeView";
import { HomeMoments } from "@/presentation/home/components/HomeMoments";
import { UpcomingDays } from "@/presentation/home/components/UpcomingDays";
import { CampaignStrip } from "@/presentation/home/components/CampaignStrip";
import { HomeFeatured, HomeUpcomingEvents } from "@/presentation/home/components/HomeFeatured";
import { SitesToday } from "@/presentation/home/components/SitesToday";
import { ActivitiesToday } from "@/presentation/home/components/ActivitiesToday";
import { AllActivities } from "@/presentation/home/components/AllActivities";
import { EscapadasSection } from "@/presentation/home/components/EscapadasSection";
import { AdRow, AdSlot } from "@/presentation/home/components/AdSlot";
import { HomeHeroSkeleton } from "@/presentation/home/components/HomeHeroSkeleton";

export const metadata: Metadata = {
  title: { absolute: "Que Hay Pa Hacer? — Eventos y planes en Ibagué" },
  description:
    "Descubre eventos y planes en Ibagué: conciertos, cultura, gastronomía, deporte y más. Encuentra qué hay pa' hacer cerca de ti.",
  alternates: { canonical: "/" },
};

/** Todo lo que depende del día (pestañas, «Lo que viene», sitios abiertos, actividades) sale de una sola lectura cacheada. */
async function Today() {
  const view = await fetchHomeView();
  // Sin eventos próximos no hay columna lateral: el momento ocupa todo el ancho.
  const hasUpcoming = view.upcoming.days.length > 0 || view.upcoming.months.length > 0;
  return (
    <>
      <Section spacing="sm" className="pt-5 sm:pt-7" containerClassName="flex flex-col gap-8 sm:gap-11">
        <HomeMoments
          view={view}
          campaign={<Suspense fallback={null}><CampaignStrip /></Suspense>}
          aside={hasUpcoming ? <UpcomingDays up={view.upcoming} /> : null}
        />
        <AdRow />
        <Suspense fallback={null}>
          <HomeUpcomingEvents ids={view.upcomingIds} total={view.upcoming.total} />
        </Suspense>
        <Suspense fallback={null}>
          <HomeFeatured />
        </Suspense>
        <Suspense fallback={null}>
          <SitesToday sites={view.sites} total={view.sitesOpenCount} />
        </Suspense>
        <Suspense fallback={null}>
          <AllActivities />
        </Suspense>
        <EscapadasSection items={view.escapadas} />
        <AdRow mobile="rectangle" />
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-7">
          <ActivitiesToday title={view.activitiesTitle} items={view.activities} />
          <Suspense fallback={null}>
            <CategoriesContainer />
          </Suspense>
        </div>
      </Section>
    </>
  );
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<HomeHeroSkeleton />}>
        <Today />
      </Suspense>
      <PreferenceEventsContainer />
      <Section spacing="sm" className="pt-8 sm:pt-11" containerClassName="flex flex-col gap-5 sm:gap-7">
        {/* tercer espacio de publicidad: solo móvil, como en el diseño */}
        <AdSlot className="md:hidden" />
        <ContributionBanner />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-7">
          <PremiumBanner />
          <CreatorVerificationBanner />
        </div>
        <VerifiedCreatorsSection />
      </Section>
    </>
  );
}
