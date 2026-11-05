import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import { fetchEventDetailById, fetchEventSessions } from "./eventDetailFetchers";
import { bogotaDayLabel, bogotaDayRange, overlapsWindow } from "../lib/bogotaDay";
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

/**
 * "Hoy" (hora de Bogotá). Caché corta: la lista cambia durante el día y al pasar la medianoche.
 * Sin eventos hoy cae a los próximos para que la página nunca quede vacía (`fallback: true`).
 */
const fetchTodayEventIds = async (): Promise<{ ids: string[]; fallback: boolean }> => {
  "use cache";
  cacheLife("minutes");
  cacheTag("event-list", "collection-today");

  const { eventFeed } = createServerContainer();
  const now = new Date();
  const end = bogotaDayRange(now).end;
  const candidates = await eventFeed.getToday(now, end);
  // Un multi-fecha cuyo rango abarca hoy NO sucede hoy si ninguna de sus fechas cae hoy: se comprueban las sesiones.
  const checked = await Promise.all(
    candidates.map(async (id) => {
      const e = await fetchEventDetailById(id);
      if (!e) return null;
      if (e.eventType !== "multi-date") return id;
      const sessions = await fetchEventSessions(id);
      return sessions.some((s) => s.status === "published" && overlapsWindow(s.startDate, s.endDate, now, end)) ? id : null;
    }),
  );
  const today = checked.filter((id): id is string => id !== null);
  if (today.length > 0) return { ids: today, fallback: false };
  return { ids: await eventFeed.getAll(), fallback: true };
};

export async function fetchTodayEvents(): Promise<{ events: Events[]; fallback: boolean }> {
  const { ids, fallback } = await fetchTodayEventIds();
  const events = await Promise.all(ids.map(fetchEventDetailById));
  return { events: events.filter((e): e is Events => Boolean(e)), fallback };
}

/** "domingo 8 de noviembre" para el subtítulo de la landing de hoy (caché corta). */
export async function fetchTodayLabel(): Promise<string> {
  "use cache";
  cacheLife("minutes");
  return bogotaDayLabel(new Date());
}
