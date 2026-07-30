import { EventCardInteractive } from "./card/EventCardInteractive";
import { EventViewModelMapper } from "../mapper/EventViewModelMapper";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";
import type { Events } from "@/domain/entities/events/Events";

const fetchAllEventIds = async () => {
  "use cache"
  cacheLife("days")
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

export const AllEventsContainer = async () => {
  "use cache";
  cacheLife("days");
  cacheTag("event-list", "all-events");
  const ids = await fetchAllEventIds();
  const eventsData = await Promise.all(ids.map(fetchEventDetail));
  const allEvents = eventsData.filter(Boolean) as Events[];

  const allEventsViewModels = allEvents.map((event) =>
    EventViewModelMapper.toViewModel(event),
  );

  return (
    <EventCardInteractive
      events={allEventsViewModels}
      info={{ title: "Lamentablemente no hay eventos disponibles :C", description: "Estamos trabajando constantemente para traerte las mejores experiencias. ¡Vuelve pronto para descubrir lo que tenemos preparado para ti!" }}
      variant="vertical"
    />
  );
};
