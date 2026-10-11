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
      info={{ title: "Todavía no hay eventos publicados", description: "Mientras tanto, mira los sitios para salir en Ibagué.", action: { href: "/donde-ir", label: "Ver sitios" } }}
      variant="vertical"
    />
  );
};
