import { EventCardInteractive } from "./card/EventCardInteractive";
import { EventViewModelMapper } from "../mapper/EventViewModelMapper";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";

const fetchAllEvents = async (userId?: string) => {
  "use cache"
  cacheLife({
    expire: 120,
    stale: 60,
    revalidate: 60
  })
  cacheTag("all-events")
  const {eventFeed} = createServerContainer();
  return await eventFeed.getAll(userId);
}

interface AllEventsContainerProps {
  userId?: string;
}

export const AllEventsContainer = async ({ userId }: AllEventsContainerProps) => {
  const allEvents = await fetchAllEvents(userId);

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
