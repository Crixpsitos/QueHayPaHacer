import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";
import { PreferenceEventsContainer } from "./PreferenceEventsContainer";
import { FeaturedEventsContainer } from "./FeaturedEventsContainer";
import { WeekendEventsContainer } from "./WeekendEventsContainer";
import { AllEventsContainer } from "./AllEventsContainer";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { Separator } from "@/app/components/ui/separator";
import type { Events } from "@/domain/entities/events/Events";

const fetchWeekendEventIds = async () => {
  "use cache";
  cacheLife({
    expire: 120,
    stale: 60,
    revalidate: 60,
  });
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

const fetchUserEventInteraction = async (eventId: string, userId: string): Promise<boolean> => {
  "use cache";
  cacheLife({
    expire: 300,
    stale: 60,
    revalidate: 60,
  });
  cacheTag(`event-interaction-${userId}-${eventId}`);
  const { eventInteractionsService } = createServerContainer();
  const interaction = await eventInteractionsService.getByEventAndUser(eventId, userId);
  return !!interaction?.liked;
};

export const HomeEventsRecomendationContainer = async () => {
  const tokens = await getTokens(await cookies(), authConfig);
  const userId = tokens?.decodedToken?.uid;

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

  const allIds = [...new Set([...weekendIds, ...featuredIds])];
  const likedByEventId: Record<string, boolean> = {};

  if (userId) {
    const likedResults = await Promise.all(
      allIds.map(async (id) => ({ id, liked: await fetchUserEventInteraction(id, userId) }))
    );
    for (const { id, liked } of likedResults) {
      likedByEventId[id] = liked;
    }
  }

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

        <FeaturedEventsContainer featuredEvents={featuredEvents} likedByEventId={likedByEventId} />
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
        <WeekendEventsContainer weekendEvents={weekendEvents} likedByEventId={likedByEventId} />
      </ContentSection>

      <ContentSection
        title="Todos los eventos"
        action={{ href: "/eventos" }}
      >
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Explora nuestro catálogo completo de eventos. Encuentra todas las
          actividades y experiencias disponibles en tu ciudad.
        </p>

        <Separator className="my-6" />

        <AllEventsContainer userId={userId} />
      </ContentSection>
      <Separator className="my-6" />
      <PreferenceEventsContainer userId={userId} />
    </>
  );
};
