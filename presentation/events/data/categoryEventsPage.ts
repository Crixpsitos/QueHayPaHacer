import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import { fetchEventDetailById } from "./eventDetailFetchers";
import type { Events } from "@/domain/entities/events/Events";

export const CATEGORY_PAGE_SIZE = 12;

/**
 * IDs de una página de categoría (por docId), por cursor. Cacheada: la clave
 * incluye (categoryId, cursor, limit), así cada página es estable hasta que se
 * publica un evento (tag `event-list`, igual que las demás listas). No lleva
 * datos por-usuario (el like se resuelve fuera).
 */
const fetchCategoryEventIds = async (
  categoryId: string,
  cursor: string | null,
  limit: number,
): Promise<{ ids: string[]; nextCursor: string | null }> => {
  "use cache";
  cacheLife("days");
  cacheTag("event-list", `category-${categoryId}`);
  const { eventsService } = createServerContainer();
  return eventsService.getEventsByCategoryPaginated(categoryId, limit, cursor);
};

/**
 * Una página de eventos de una categoría, con cursor para la siguiente. IDs
 * cacheados (por cursor); los detalles también (`fetchEventDetailById`).
 */
export async function getCategoryEventsPage(
  categoryId: string,
  cursor: string | null,
  limit: number = CATEGORY_PAGE_SIZE,
): Promise<{ events: Events[]; nextCursor: string | null }> {
  const { ids, nextCursor } = await fetchCategoryEventIds(categoryId, cursor, limit);
  const events = (await Promise.all(ids.map(fetchEventDetailById))).filter(
    (e): e is Events => Boolean(e),
  );
  return { events, nextCursor };
}
