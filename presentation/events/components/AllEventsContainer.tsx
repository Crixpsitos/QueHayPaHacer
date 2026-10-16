import { InfiniteEventList } from "./InfiniteEventList";
import { EventViewModelMapper } from "../mapper/EventViewModelMapper";
import { getAllEventsPage } from "../data/allEventsPage";
import { cacheLife, cacheTag } from "next/cache";

/**
 * "Todos los eventos": primera página cacheada del servidor + "Cargar más" por
 * cursor (server action pública) en el mismo listado.
 */
export const AllEventsContainer = async () => {
  "use cache";
  cacheLife("days");
  cacheTag("event-list", "all-events");
  const { events, nextCursor } = await getAllEventsPage(null);

  return (
    <InfiniteEventList
      initialEvents={events.map((e) => EventViewModelMapper.toViewModel(e))}
      initialCursor={nextCursor}
      initialLikedByEventId={{}}
    />
  );
};
