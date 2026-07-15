import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import type {
  EventStats,
  EventRegistrationsResult,
  GetEventRegistrationsParams,
  MultiDateEventStats,
} from "@/domain/entities/studio/Studio";

/**
 * Caché del Estudio. Somos MVP: cada lectura a Firestore cuesta, así que todo lo
 * de lectura pasa por aquí y las mutaciones invalidan por tag (ver las actions
 * de `app/actions/studio`).
 *
 * El ahorro grande no es el TTL, es COMPARTIR la entrada: el detalle de un
 * evento renderiza `page` + slot `stats` + slot `registrations`, y los tres
 * piden las mismas stats. Sin caché son 3 lecturas por vista; con estos
 * fetchers, 1.
 */

/** Tag de las stats de un evento o de una de sus sesiones. */
export const studioStatsTag = (eventId: string, sessionId?: string): string =>
  sessionId ? `studio-stats-${eventId}-${sessionId}` : `studio-stats-${eventId}`;

/** Tag de la tabla de inscritos de un evento o de una de sus sesiones. */
export const studioRegistrationsTag = (
  eventId: string,
  sessionId?: string,
): string =>
  sessionId
    ? `studio-registrations-${eventId}-${sessionId}`
    : `studio-registrations-${eventId}`;

/** Tag del acumulado multi-date (evento + sesiones). */
export const studioMultiDateTag = (eventId: string): string =>
  `studio-multidate-${eventId}`;

/**
 * Stats de un evento o de una sesión (`sessionId`). Compartido por el header,
 * el panel de gráficas y el slot de registros: una sola lectura para los tres.
 */
export async function getCachedEventStats(
  eventId: string,
  sessionId?: string,
): Promise<EventStats | null> {
  "use cache";
  cacheTag(studioStatsTag(eventId, sessionId), `event-sessions-${eventId}`);
  cacheLife("hours");
  const { studioService } = createServerContainer();
  return studioService.getEventStats(eventId, sessionId);
}

/**
 * Analíticas multi-date del Estudio (evento + sesiones + acumulado).
 *
 * Se etiqueta también con `event-sessions-${eventId}`, el tag que las actions de
 * sesión (crear/editar/borrar/publicar) ya invalidan: así el Estudio se refresca
 * al tocar una sesión sin cablear un tag nuevo en cada action.
 */
export async function getCachedMultiDateEventStats(
  eventId: string,
): Promise<MultiDateEventStats | null> {
  "use cache";
  cacheTag(studioMultiDateTag(eventId), `event-sessions-${eventId}`);
  cacheLife("hours");
  const { studioService } = createServerContainer();
  return studioService.getMultiDateEventStats(eventId);
}

/**
 * Página de inscritos. La entrada de caché se keyea por los `params` (orden,
 * límite, cursor, búsqueda), así que cada combinación cachea por separado y
 * volver atrás en la paginación no vuelve a leer Firestore.
 *
 * `cacheLife("minutes")`: es la vista más "viva" del Estudio (alguien se
 * registra y el organizador quiere verlo), pero las mutaciones propias
 * (confirmar/quitar) invalidan por tag igualmente.
 */
export async function getCachedEventRegistrations(
  eventId: string,
  params: GetEventRegistrationsParams,
  sessionId?: string,
): Promise<EventRegistrationsResult | null> {
  "use cache";
  cacheTag(studioRegistrationsTag(eventId, sessionId));
  cacheLife("minutes");
  const { studioService } = createServerContainer();
  return studioService.getEventRegistrations(eventId, params, sessionId);
}
