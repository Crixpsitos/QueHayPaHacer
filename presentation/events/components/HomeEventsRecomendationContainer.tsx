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

const fetchWeekendEvents = async (userId?: string) => {
  "use cache";
  cacheLife({
    expire: 120,
    stale: 60,
    revalidate: 60,
  });
  cacheTag("event-list", "weekend-events");
  const { eventFeed } = createServerContainer();
  return await eventFeed.getWeekend(userId);
};

const fetchFeaturedEvents = async (userId?: string) => {
  "use cache";
  cacheLife({
    expire: 120,
    stale: 60,
    revalidate: 60,
  });
  cacheTag("event-list", "featured-events");
  const { eventFeed } = createServerContainer();
  return await eventFeed.getFeatured(userId);
};

export const HomeEventsRecomendationContainer = async () => {
  const tokens = await getTokens(await cookies(), authConfig);
  const userId = tokens?.decodedToken?.uid;

  // Ejecutar ambos fetches en paralelo
  const [weekendEvents, featuredEvents] = await Promise.all([
    fetchWeekendEvents(userId),
    fetchFeaturedEvents(userId),
  ]);

  return (
    <>
      <ContentSection title="Los eventos más destacados">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Descubre los eventos más populares y recomendados en tu ciudad. Desde
          conciertos hasta exposiciones, encuentra lo mejor para disfrutar.
        </p>

        <Separator className="my-6" />

        <FeaturedEventsContainer featuredEvents={featuredEvents} />
      </ContentSection>

      <ContentSection title="Eventos para esta semana">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Explora los eventos que se llevarán a cabo esta semana. Mantente al
          día con las actividades y no te pierdas de nada.
        </p>

        <Separator className="my-6" />
        <WeekendEventsContainer weekendEvents={weekendEvents} />
      </ContentSection>

      <ContentSection title="Todos los eventos">
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
