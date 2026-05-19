import { EventCardInteractive } from "./card/EventCardInteractive";
import { EventViewModelMapper } from "../mapper/EventViewModelMapper";
import { EventFeedItem } from "@/application/aggregations/EventFeed/EventFeed";

interface FeaturedEventsContainerProps {
  featuredEvents: EventFeedItem[];
}

export const FeaturedEventsContainer = async ({ featuredEvents }: FeaturedEventsContainerProps) => {
  const featuredEventsViewModels = featuredEvents.map((event) =>
    EventViewModelMapper.toViewModel(event.event),
  );

  const featuredEventsInteractions = featuredEvents.map(
    (event) => event.interaction,
  );

  const likedByEventId = Object.fromEntries(
    featuredEventsInteractions
      .filter(
        (interaction): interaction is NonNullable<typeof interaction> =>
          interaction !== null && interaction !== undefined,
      )
      .map((interaction) => [interaction.eventId, !!interaction.liked]),
  );

  return (
    <EventCardInteractive
      events={featuredEventsViewModels}
      attendeeCount={featuredEventsViewModels.reduce(
        (total, event) => total + (event.analytics?.registrations || 0),
        0,
      )}
      likedByEventId={likedByEventId}
      info={{ title: "Lamentablemente no hay eventos destacados :C", description: "Estamos trabajando constantemente para traerte las mejores experiencias. ¡Vuelve pronto para descubrir lo que tenemos preparado para ti!" }}
      variant="horizontal"
    />
  );
};
