import { EventCardInteractive } from "./card/EventCardInteractive";
import { EventViewModelMapper } from "../mapper/EventViewModelMapper";
import { EventFeedItem } from "@/application/aggregations/EventFeed/EventFeed";

interface WeekendEventsContainerProps {
  weekendEvents: EventFeedItem[];
}

export const WeekendEventsContainer = async ({ weekendEvents }: WeekendEventsContainerProps) => {
  const weekendEventsViewModels = weekendEvents.map((event) =>
    EventViewModelMapper.toViewModel(event.event),
  );

  const weekendEventsInteractions = weekendEvents.map(
    (event) => event.interaction,
  );

  const likedByEventId = Object.fromEntries(
    weekendEventsInteractions
      .filter(
        (interaction): interaction is NonNullable<typeof interaction> =>
          interaction !== null && interaction !== undefined,
      )
      .map((interaction) => [interaction.eventId, !!interaction.liked]),
  );

  return (
    <EventCardInteractive
      events={weekendEventsViewModels}
      attendeeCount={weekendEventsViewModels.reduce(
        (total, event) => total + (event.analytics?.registrations || 0),
        0,
      )}
      likedByEventId={likedByEventId}
      info={{ title: "Lamentablemente no hay eventos para esta semana :C", description: "Estamos trabajando constantemente para traerte las mejores experiencias. ¡Vuelve pronto para descubrir lo que tenemos preparado para ti!" }}
      variant="vertical"
    />
  );
};

