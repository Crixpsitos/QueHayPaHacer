import { createServerContainer } from "@/infraestructure/di/container"
import { cacheLife, cacheTag } from "next/cache"
import { UserPreferencesViewModelMapper } from "../mapper/UserPreferencesViewModelMapper"
import { UserPreferencesViewModel } from "../view-models/UserPreferencesViewModel"
import { EventCardInteractive } from "./card/EventCardInteractive"
import { EventViewModelMapper } from "../mapper/EventViewModelMapper"
import { ContentSection } from "@/app/components/layout/shared/ContentSection"
import { Separator } from "@/app/components/ui/separator"
import type { Events } from "@/domain/entities/events/Events"

interface PreferenceEventsContainerProps {
  userId?: string;
}

async function getUserPreferences(userId?: string): Promise<UserPreferencesViewModel | null> {
    "use cache"
    cacheLife({
      expire: 120,
      stale: 60,
      revalidate: 60
    })
    cacheTag(`user-preferences-${userId}`)

    if (!userId) return null;

    const {userPreferencesService} = createServerContainer();
    const preferences = await userPreferencesService.getPreferences(userId);
    
    if (!preferences) return null;
    
    return UserPreferencesViewModelMapper.toViewModel(preferences);
}

async function getPreferenceEventIds(preferences: UserPreferencesViewModel): Promise<string[]> {
    "use cache"
    cacheTag(`preference-events-${preferences.userId}`)
    cacheLife({
      expire: 120,
      stale: 60,
      revalidate: 60
    })

    const topCategoryIds = Object.entries(preferences.categories)
      .sort(([, a], [, b]) => b.score - a.score)
      .slice(0, 3)
      .map(([categoryId]) => categoryId);

    if (topCategoryIds.length === 0) return [];

    const { eventFeed } = createServerContainer();
    return await eventFeed.getByUserPreferences(topCategoryIds);
}

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

export const PreferenceEventsContainer = async ({ userId }: PreferenceEventsContainerProps) => {
    const preferences = await getUserPreferences(userId);

    if(!preferences) return <></>;

    const eventIds = await getPreferenceEventIds(preferences);
    const eventsData = await Promise.all(eventIds.map(fetchEventDetail));
    const events = eventsData.filter(Boolean) as Events[];

    const likedByEventId: Record<string, boolean> = {};
    if (userId) {
      const likedResults = await Promise.all(
        eventIds.map(async (id) => ({ id, liked: await fetchUserEventInteraction(id, userId) }))
      );
      for (const { id, liked } of likedResults) {
        likedByEventId[id] = liked;
      }
    }

    const preferenceEventsViewModels = events.map((event) =>
      EventViewModelMapper.toViewModel(event),
    );

  return (
    <ContentSection title="Tus preferencias">
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Estas son las actividades que te gustaron en las que te interesan. ¡No te pierdas de nada!
      </p>
      <Separator className="my-6" />
    <EventCardInteractive
      events={preferenceEventsViewModels}
      likedByEventId={likedByEventId}
      info={{ title: "Lamentablemente no hay eventos recomendados :C", description: "Estamos trabajando constantemente para traerte las mejores experiencias. ¡Vuelve pronto para descubrir lo que tenemos preparado para ti!" }}
      variant="vertical"
    />
    </ContentSection>
  )
}

