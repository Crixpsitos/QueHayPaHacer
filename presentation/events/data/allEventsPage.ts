import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import { fetchEventDetailById } from "./eventDetailFetchers";
import type { Events } from "@/domain/entities/events/Events";

export const ALL_EVENTS_PAGE_SIZE = 12;

/**
 * IDs de una página de "Todos los eventos", por cursor. Cacheada por (cursor,
 * limit) con los tags `event-list` / `all-events` (las mismas invalidaciones que
 * las demás listas). Sin datos por-usuario.
 */
const fetchAllEventIdsPage = async (
  cursor: string | null,
  limit: number,
): Promise<{ ids: string[]; nextCursor: string | null }> => {
  "use cache";
  cacheLife("days");
  cacheTag("event-list", "all-events");
  const { eventsService } = createServerContainer();
  return eventsService.getAllEventsPaginated(limit, cursor);
};

/** Una página de todos los eventos próximos + cursor de la siguiente. */
export async function getAllEventsPage(
  cursor: string | null,
  limit: number = ALL_EVENTS_PAGE_SIZE,
): Promise<{ events: Events[]; nextCursor: string | null }> {
  const { ids, nextCursor } = await fetchAllEventIdsPage(cursor, limit);
  const events = (await Promise.all(ids.map(fetchEventDetailById))).filter(
    (e): e is Events => Boolean(e),
  );
  return { events, nextCursor };
}
