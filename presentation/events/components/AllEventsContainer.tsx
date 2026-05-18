import { EventCardInteractive } from "./card/EventCardInteractive";
import { EventViewModelMapper } from "../mapper/EventViewModelMapper";
import { EventFeedItem } from "@/application/aggregations/EventFeed/EventFeed";

interface AllEventsContainerProps {
  allEvents: EventFeedItem[];
}

export const AllEventsContainer = async ({ allEvents }: AllEventsContainerProps) => {
  const allEventsViewModels = allEvents.map((event) =>
    EventViewModelMapper.toViewModel(event.event),
  );

  const allEventsInteractions = allEvents.map(
    (event) => event.interaction,
  );

  const likedByEventId = Object.fromEntries(
    allEventsInteractions
      .filter(
        (interaction): interaction is NonNullable<typeof interaction> =>
          interaction !== null && interaction !== undefined,
      )
      .map((interaction) => [interaction.eventId, !!interaction.liked]),
  );

  return (
    <EventCardInteractive
      events={allEventsViewModels}
      attendeeCount={allEventsViewModels.reduce(
        (total, event) => total + (event.analytics?.registrations || 0),
        0,
      )}
      likedByEventId={likedByEventId}
      info={{ title: "Lamentablemente no hay eventos disponibles :C", description: "Estamos trabajando constantemente para traerte las mejores experiencias. ¡Vuelve pronto para descubrir lo que tenemos preparado para ti!" }}
      variant="vertical"
    />
  );
};
