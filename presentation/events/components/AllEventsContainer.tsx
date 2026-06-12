import { EventCardInteractive } from "./card/EventCardInteractive";
import { EventViewModelMapper } from "../mapper/EventViewModelMapper";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";
import type { Events } from "@/domain/entities/events/Events";

const fetchAllEventIds = async () => {
  "use cache"
  cacheLife("hours")
  cacheTag("event-list", "all-events")
  const { eventFeed } = createServerContainer();
  return await eventFeed.getAll();
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

interface AllEventsContainerProps {
  userId?: string;
}

export const AllEventsContainer = async ({ userId }: AllEventsContainerProps) => {
  const ids = await fetchAllEventIds();
  const eventsData = await Promise.all(ids.map(fetchEventDetail));
  const allEvents = eventsData.filter(Boolean) as Events[];

  const likedByEventId: Record<string, boolean> = {};
  if (userId) {
    const likedResults = await Promise.all(
      ids.map(async (id) => ({ id, liked: await fetchUserEventInteraction(id, userId) }))
    );
    for (const { id, liked } of likedResults) {
      likedByEventId[id] = liked;
    }
  }

  const allEventsViewModels = allEvents.map((event) =>
    EventViewModelMapper.toViewModel(event),
  );

  return (
    <EventCardInteractive
      events={allEventsViewModels}
      likedByEventId={likedByEventId}
      info={{ title: "Lamentablemente no hay eventos disponibles :C", description: "Estamos trabajando constantemente para traerte las mejores experiencias. ¡Vuelve pronto para descubrir lo que tenemos preparado para ti!" }}
      variant="vertical"
    />
  );
};
