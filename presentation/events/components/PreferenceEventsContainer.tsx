import { createServerContainer } from "@/infraestructure/di/container"
import { cacheLife, cacheTag } from "next/cache"
import { UserPreferencesViewModelMapper } from "../mapper/UserPreferencesViewModelMapper"
import { UserPreferencesViewModel } from "../view-models/UserPreferencesViewModel"
import { EventCardInteractive } from "./card/EventCardInteractive"
import { EventViewModelMapper } from "../mapper/EventViewModelMapper"
import { ContentSection } from "@/app/components/layout/shared/ContentSection"
import { Separator } from "@/app/components/ui/separator"

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

async function getPreferenceEvents(preferences: UserPreferencesViewModel, userId?: string) {
    "use cache"
    cacheLife({
      expire: 120,
      stale: 60,
      revalidate: 60
    })
    cacheTag(`preference-events-${preferences.userId}`)

      const topCategoryIds = Object.entries(preferences.categories)
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 3)
    .map(([categoryId]) => categoryId);

  if (topCategoryIds.length === 0) return [];

  const {eventFeed} = createServerContainer();
  return await eventFeed.getByUserPreferences(topCategoryIds, userId);


}



export const PreferenceEventsContainer = async ({ userId }: PreferenceEventsContainerProps) => {
      const preferences = await getUserPreferences(userId);

      console.log(preferences);

      if(!preferences) return <></>;

      const events = await getPreferenceEvents(preferences, userId);
      console.log(events);

      const preferenceEventsViewModels = events.map((event) =>
        EventViewModelMapper.toViewModel(event.event),
      );

      const preferenceEventsInteractions = events.map(
        (event) => event.interaction,
      );

      const likedByEventId = Object.fromEntries(
        preferenceEventsInteractions
          .filter(
            (interaction): interaction is NonNullable<typeof interaction> =>
              interaction !== null && interaction !== undefined,
          )
          .map((interaction) => [interaction.eventId, !!interaction.liked]),
      );

  return (
    <ContentSection title="Tus preferencias">
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Estas son las actividades que te gustaron en las que te interesan. ¡No te pierdas de nada!
      </p>
      <Separator className="my-6" />
    <EventCardInteractive
      events={preferenceEventsViewModels}
      attendeeCount={preferenceEventsViewModels.reduce(
        (total, event) => total + (event.analytics?.registrations || 0),
        0,
      )}
      likedByEventId={likedByEventId}
      info={{ title: "Lamentablemente no hay eventos recomendados :C", description: "Estamos trabajando constantemente para traerte las mejores experiencias. ¡Vuelve pronto para descubrir lo que tenemos preparado para ti!" }}
      variant="vertical"
    />
    </ContentSection>
  )
}

