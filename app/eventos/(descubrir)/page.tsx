import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/app/components/layout/shared/Section";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { Separator } from "@/app/components/ui/separator";
import { FeaturedEventsContainer } from "@/presentation/events/components/FeaturedEventsContainer";
import { WeekendEventsContainer } from "@/presentation/events/components/WeekendEventsContainer";
import { AllEventsContainer } from "@/presentation/events/components/AllEventsContainer";
import { getEventCollections } from "@/presentation/events/lib/eventCollections";
import { fetchCollectionEvents } from "@/presentation/events/data/collectionFetchers";

export const metadata: Metadata = {
  title: "Eventos en Ibagué | Que Hay Pa Hacer?",
  description:
    "Descubre todos los eventos en Ibagué: destacados, planes para este fin de semana y por categoría. Conciertos, cultura, gastronomía y más.",
  alternates: { canonical: "/eventos" },
};

export default async function EventosIndexPage() {
  const collections = await getEventCollections();
  // Por kind (no por slug hardcodeado): robusto a cambios de formato de slug.
  const featuredDef = collections.find((c) => c.kind === "featured");
  const weekendDef = collections.find((c) => c.kind === "weekend");
  const categoryCollections = collections.filter((c) => c.kind === "category");

  const [featuredEvents, weekendEvents] = await Promise.all([
    featuredDef ? fetchCollectionEvents(featuredDef) : Promise.resolve([]),
    weekendDef ? fetchCollectionEvents(weekendDef) : Promise.resolve([]),
  ]);

  return (
    <>
      <Section spacing="sm" className="mt-4">
        <h1 className="text-3xl font-bold">Eventos en Ibagué</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Todo lo que hay pa&apos; hacer en la ciudad: lo más destacado, planes de fin
          de semana y eventos por categoría.
        </p>

        {categoryCollections.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {categoryCollections.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="rounded-full border border-border bg-secondary px-4 py-1.5 text-sm font-medium transition-colors hover:bg-secondary/70"
              >
                {c.shortLabel}
              </Link>
            ))}
          </div>
        )}
      </Section>

      <ContentSection
        title="Eventos destacados"
        action={{ href: "/eventos-destacados-ibague" }}
      >
        <FeaturedEventsContainer featuredEvents={featuredEvents} />
      </ContentSection>

      <ContentSection
        title="Este fin de semana"
        action={{ href: "/eventos-este-fin-de-semana-ibague" }}
      >
        <WeekendEventsContainer weekendEvents={weekendEvents} />
      </ContentSection>

      <Separator className="my-6" />

      <ContentSection title="Todos los eventos">
        <AllEventsContainer />
      </ContentSection>
    </>
  );
}
