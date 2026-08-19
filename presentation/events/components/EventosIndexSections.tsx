import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { Separator } from "@/app/components/ui/separator";
import { FeaturedEventsContainer } from "@/presentation/events/components/FeaturedEventsContainer";
import { WeekendEventsContainer } from "@/presentation/events/components/WeekendEventsContainer";
import { AllEventsContainer } from "@/presentation/events/components/AllEventsContainer";
import { getEventCollections } from "@/presentation/events/lib/eventCollections";
import { fetchCollectionEvents } from "@/presentation/events/data/collectionFetchers";

/**
 * Secciones de eventos del índice /eventos. Hueco dinámico (PPR): lee la cookie
 * para pintar el like del usuario (igual que el home). Va dentro de un <Suspense>
 * — con Cache Components leer `cookies()` obliga a un boundary. Los datos de
 * eventos están cacheados; solo el like es por-request.
 */
export async function EventosIndexSections() {
  const collections = await getEventCollections();
  const featuredDef = collections.find((c) => c.kind === "featured");
  const weekendDef = collections.find((c) => c.kind === "weekend");

  const [featuredEvents, weekendEvents] = await Promise.all([
    featuredDef ? fetchCollectionEvents(featuredDef) : Promise.resolve([]),
    weekendDef ? fetchCollectionEvents(weekendDef) : Promise.resolve([]),
  ]);

  return (
    <>
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

      <ContentSection
        title="Todos los eventos"
        action={{ href: "/eventos-todos-ibague" }}
      >
        <AllEventsContainer />
      </ContentSection>
    </>
  );
}
