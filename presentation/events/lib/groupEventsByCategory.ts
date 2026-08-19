import type { Events } from "@/domain/entities/events/Events";
import type { CollectionDef } from "./eventCollections";

export interface EventCategoryGroup {
  /** Clave estable del grupo (slug de la categoría o el label si no matchea). */
  key: string;
  /** Nombre a mostrar (ej. "Música"). */
  label: string;
  /** Slug de la landing de esa categoría (`eventos-musica-ibague`) — para el "Ver más". */
  landingSlug?: string;
  events: Events[];
}

/**
 * Agrupa eventos por su categoría, resolviendo cada uno contra el registro de
 * colecciones para saber a qué landing de categoría enlazar. Match por
 * `categoryInfo.id` O `slug` (los eventos guardan el campo inconsistente: unos el
 * docId, otros el slug). Sin match → cae en un grupo con el título del evento.
 */
export function groupEventsByCategory(
  events: Events[],
  collections: CollectionDef[],
): EventCategoryGroup[] {
  const catByKey = new Map<string, { label: string; slug: string }>();
  const catByTitle = new Map<string, { label: string; slug: string }>();
  for (const c of collections) {
    if (c.kind !== "category") continue;
    const entry = { label: c.shortLabel, slug: c.slug };
    if (c.categoryId) catByKey.set(c.categoryId, entry);
    if (c.categorySlug) catByKey.set(c.categorySlug, entry);
    catByTitle.set(c.shortLabel.toLowerCase(), entry);
  }

  const groups = new Map<string, EventCategoryGroup>();
  for (const ev of events) {
    const ci = ev.categoryInfo;
    const resolved =
      (ci?.id ? catByKey.get(ci.id) : undefined) ??
      (ci?.slug ? catByKey.get(ci.slug) : undefined) ??
      (ci?.title ? catByTitle.get(ci.title.toLowerCase()) : undefined);

    const label = resolved?.label ?? ci?.title ?? "Otros";
    const key = resolved?.slug ?? label;

    let group = groups.get(key);
    if (!group) {
      group = { key, label, landingSlug: resolved?.slug, events: [] };
      groups.set(key, group);
    }
    group.events.push(ev);
  }

  return [...groups.values()];
}
