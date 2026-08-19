import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";
import { FeaturedEventsContainer } from "./FeaturedEventsContainer";
import { WeekendEventsContainer } from "./WeekendEventsContainer";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { HomeSitesContainer } from "@/presentation/sites/components/home/HomeSitesContainer";
import { Separator } from "@/app/components/ui/separator";
import type { Events } from "@/domain/entities/events/Events";

const fetchWeekendEventIds = async () => {
  "use cache";
  cacheLife("hours");
  cacheTag("event-list", "weekend-events");
  const { eventFeed } = createServerContainer();
  return await eventFeed.getWeekend();
};

const fetchFeaturedEventIds = async () => {
  "use cache";
  cacheLife("hours");
  cacheTag("event-list", "featured-events");
  const { eventFeed } = createServerContainer();
  return await eventFeed.getFeatured();
};

const fetchEventDetail = async (id: string): Promise<Events | null> => {
  "use cache";
  cacheLife("weeks");
  cacheTag(`event-${id}`);
  const { eventsService } = createServerContainer();
  return await eventsService.getEventById(id);
};

export const HomeEventsRecomendationContainer = async () => {
  "use cache";
  cacheLife("days");
  cacheTag("event-list", "featured-events", "weekend-events");

  const [weekendIds, featuredIds] = await Promise.all([
    fetchWeekendEventIds(),
    fetchFeaturedEventIds(),
  ]);

  const [weekendEventsData, featuredEventsData] = await Promise.all([
    Promise.all(weekendIds.map(fetchEventDetail)),
    Promise.all(featuredIds.map(fetchEventDetail)),
  ]);

  const weekendEvents = weekendEventsData.filter(Boolean) as Events[];
  const featuredEvents = featuredEventsData.filter(Boolean) as Events[];

  return (
    <>
      <ContentSection
        title="Los eventos más destacados"
        action={{ href: "/eventos-destacados-ibague" }}
      >
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Descubre los eventos más populares y recomendados en tu ciudad. Desde
          conciertos hasta exposiciones, encuentra lo mejor para disfrutar.
        </p>

        <Separator className="my-6" />

        <FeaturedEventsContainer featuredEvents={featuredEvents} />
      </ContentSection>

      <ContentSection
        title="Sitios populares"
        action={{ href: "/donde-ir" }}
      >
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Los mejores lugares de la ciudad para comer, tomar algo, disfrutar y más.
        </p>
        <Separator className="my-6" />
        <HomeSitesContainer />
      </ContentSection>

      <ContentSection
        title="Eventos para esta semana"
        action={{ href: "/eventos-este-fin-de-semana-ibague" }}
      >
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Explora los eventos que se llevarán a cabo esta semana. Mantente al
          día con las actividades y no te pierdas de nada.
        </p>

        <Separator className="my-6" />
        <WeekendEventsContainer weekendEvents={weekendEvents.slice(0, 4)} />
      </ContentSection>
      <Separator className="my-6" />
    </>
  );
};
