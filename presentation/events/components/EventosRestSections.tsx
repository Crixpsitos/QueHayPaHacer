import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { Separator } from "@/app/components/ui/separator";
import { WeekendEventsContainer } from "./WeekendEventsContainer";
import { AllEventsContainer } from "./AllEventsContainer";
import { getEventCollections } from "@/presentation/events/lib/eventCollections";
import { fetchCollectionEvents } from "@/presentation/events/data/collectionFetchers";

/** Secciones de fin de semana y todos los eventos. Se renderiza en Suspense. */
export async function EventosRestSections() {
  const collections = await getEventCollections();
  const weekendDef = collections.find((c) => c.kind === "weekend");
  const weekendEvents = weekendDef ? await fetchCollectionEvents(weekendDef) : [];

  return (
    <>
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
