import { createServerContainer } from "@/infraestructure/di/container";
import { fetchEventDetailById } from "./eventDetailFetchers";
import type { Events } from "@/domain/entities/events/Events";

export const CATEGORY_PAGE_SIZE = 12;

/**
 * Una página de eventos de una categoría (por docId), con cursor para la
 * siguiente. IDs por cursor (no cacheado — depende del cursor); los detalles sí
 * están cacheados (`fetchEventDetailById`, tag `event-${id}`).
 */
export async function getCategoryEventsPage(
  categoryId: string,
  cursor: string | null,
  limit: number = CATEGORY_PAGE_SIZE,
): Promise<{ events: Events[]; nextCursor: string | null }> {
  const { eventsService } = createServerContainer();
  const { ids, nextCursor } = await eventsService.getEventsByCategoryPaginated(
    categoryId,
    limit,
    cursor,
  );
  const events = (await Promise.all(ids.map(fetchEventDetailById))).filter(
    (e): e is Events => Boolean(e),
  );
  return { events, nextCursor };
}
