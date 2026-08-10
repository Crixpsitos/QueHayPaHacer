import type { Metadata } from "next";
import { Suspense } from "react";
import { MapPin } from "lucide-react";
import { Section } from "@/app/components/layout/shared/Section";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { EventsSectionsSkeleton } from "@/presentation/events/components/EventsSectionsSkeleton";
import { EventosRestSections } from "@/presentation/events/components/EventosRestSections";
import { FeaturedEventsContainer } from "@/presentation/events/components/FeaturedEventsContainer";
import { EventsCategoryChips } from "@/presentation/events/components/EventsCategoryChips";
import { ExploreSearchBar } from "@/app/components/feature/home/ExploreSearchBar";
import { getEventCollections } from "@/presentation/events/lib/eventCollections";
import { fetchCollectionEvents } from "@/presentation/events/data/collectionFetchers";

export const metadata: Metadata = {
  title: "Eventos en Ibagué",
  description:
    "Descubre todos los eventos en Ibagué: destacados, planes para este fin de semana y por categoría. Conciertos, cultura, gastronomía y más.",
  alternates: { canonical: "/eventos" },
};

export default async function EventosIndexPage() {
  const collections = await getEventCollections();
  const categoryCollections = collections.filter((c) => c.kind === "category");
  const featuredDef = collections.find((c) => c.kind === "featured");
  const featuredEvents = featuredDef ? await fetchCollectionEvents(featuredDef) : [];

  return (
    <>
      <Section spacing="sm" className="mt-4">
        <div className="flex items-center gap-1.5 text-sm font-medium text-[#71717A]">
          <MapPin className="size-4 text-[#E63946]" />
          <span>Ibagué, Tolima</span>
        </div>

        <h1
          className="mt-2 text-4xl font-bold tracking-tight text-[#09090B]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Eventos en <span className="text-[#E63946]">Ibagué</span>
        </h1>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-[#71717A]">
          Lo más destacado, planes de fin de semana y eventos por categoría.
        </p>

        <div className="mt-6">
          <ExploreSearchBar />
        </div>

        {categoryCollections.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#71717A]">
              Explorar por categoría
            </p>
            <EventsCategoryChips collections={categoryCollections} />
          </div>
        )}
      </Section>

      {/* Featured fuera del Suspense: la imagen LCP queda en el HTML inicial con priority */}
      <ContentSection
        title="Eventos destacados"
        action={{ href: "/eventos-destacados-ibague" }}
      >
        <FeaturedEventsContainer featuredEvents={featuredEvents} />
      </ContentSection>

      {/* Fin de semana + todos: streaming cuando estén listos */}
      <Suspense fallback={<EventsSectionsSkeleton />}>
        <EventosRestSections />
      </Suspense>
    </>
  );
}
