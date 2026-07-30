import { createServerContainer } from "@/infraestructure/di/container"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { getTokens } from "next-firebase-auth-edge"
import { cookies } from "next/headers"
import { cacheLife, cacheTag } from "next/cache"
import { UserPreferencesViewModelMapper } from "../mapper/UserPreferencesViewModelMapper"
import { UserPreferencesViewModel } from "../view-models/UserPreferencesViewModel"
import { EventCardInteractive } from "./card/EventCardInteractive"
import { EventViewModelMapper } from "../mapper/EventViewModelMapper"
import { ContentSection } from "@/app/components/layout/shared/ContentSection"
import { Separator } from "@/app/components/ui/separator"
import type { Events } from "@/domain/entities/events/Events"

async function getUserPreferences(userId?: string): Promise<UserPreferencesViewModel | null> {
    "use cache"
    cacheLife("hours")
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
    cacheLife("hours")

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

export const PreferenceEventsContainer = async () => {
    const tokens = await getTokens(await cookies(), authConfig);
    const userId = tokens?.decodedToken?.uid;

    const preferences = await getUserPreferences(userId);

    if(!preferences) return null;

    const eventIds = await getPreferenceEventIds(preferences);
    const eventsData = await Promise.all(eventIds.map(fetchEventDetail));
    const events = eventsData.filter(Boolean) as Events[];

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
      info={{ title: "Lamentablemente no hay eventos recomendados :C", description: "Estamos trabajando constantemente para traerte las mejores experiencias. ¡Vuelve pronto para descubrir lo que tenemos preparado para ti!" }}
      variant="vertical"
    />
    </ContentSection>
  )
}

