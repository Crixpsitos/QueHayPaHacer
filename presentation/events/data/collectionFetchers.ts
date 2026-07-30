import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import { fetchEventDetailById } from "./eventDetailFetchers";
import type { CollectionDef } from "../lib/eventCollections";
import type { Events } from "@/domain/entities/events/Events";

/**
 * IDs de eventos de una colección. Reusa las queries que ya existen:
 * destacados/fin de semana vía `eventFeed`, categoría vía `getByUserPreferences`
 * (que ya llama a `findByTopCategory`). Cacheada + tag `event-list` compartido
 * (se refresca con las mismas invalidaciones que el home).
 */
const fetchCollectionEventIds = async (
  slug: string,
  kind: CollectionDef["kind"],
  categoryId?: string,
  categorySlug?: string,
): Promise<string[]> => {
  "use cache";
  cacheLife("days");
  cacheTag("event-list", `collection-${slug}`);

  const { eventFeed } = createServerContainer();
  if (kind === "featured") return eventFeed.getFeatured();
  if (kind === "weekend") return eventFeed.getWeekend();
  if (kind === "all") return eventFeed.getAll();
  // Filtra por id O slug: `categoryInfo.id` en los eventos es inconsistente.
  const catValues = [categoryId, categorySlug].filter((v): v is string => Boolean(v));
  return catValues.length ? eventFeed.getByUserPreferences(catValues) : [];
};

/** Eventos (detalle) de una colección, listos para mapear a ViewModel. */
export async function fetchCollectionEvents(def: CollectionDef): Promise<Events[]> {
  const ids = await fetchCollectionEventIds(
    def.slug,
    def.kind,
    def.categoryId,
    def.categorySlug,
  );
  const events = await Promise.all(ids.map(fetchEventDetailById));
  return events.filter((e): e is Events => Boolean(e));
}
