import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import type { Events } from "@/domain/entities/events/Events";
import type { EventSession } from "@/domain/entities/events/EventSession";

/**
 * Fetchers cacheados del detalle de evento. Se comparten entre el detalle del
 * evento y el detalle de una sesión: ambos golpean las MISMAS entradas de caché
 * (mismos tags), así que ver una sesión no dispara lecturas extra a Firestore.
 */

export const fetchEventDetailById = async (id: string): Promise<Events | null> => {
  "use cache";
  cacheLife("weeks");
  cacheTag(`event-${id}`);
  const { eventsService } = createServerContainer();
  return await eventsService.getEventById(id);
};

export const fetchEventDetailBySlug = async (slug: string): Promise<Events | null> => {
  "use cache";
  cacheLife("weeks");
  cacheTag(`event-slug-${slug}`);
  const { eventsService } = createServerContainer();
  const event = await eventsService.getEventBySlug(slug);

  // Además del tag por slug, esta entrada cuelga del tag por ID: las actions
  // (like, share, publicar, editar) invalidan `event-<id>` porque no conocen el
  // slug. Sin esto, quien entra por /eventos/<slug> —o sea, todo el mundo— se
  // come una copia fósil durante semanas: contador viejo con estado fresco.
  if (event?.id) cacheTag(`event-${event.id}`);

  return event;
};

/**
 * Sesiones de un evento multi-date. cacheLife alto + tag propio
 * (`event-sessions-${eventId}`), invalidado por las actions de sesión.
 */
export const fetchEventSessions = async (eventId: string): Promise<EventSession[]> => {
  "use cache";
  cacheLife("weeks");
  cacheTag(`event-sessions-${eventId}`);
  const { eventSessionService } = createServerContainer();
  return await eventSessionService.getByEventId(eventId);
};

/** Like del EVENTO: no hay like por sesión, así que el detalle de una fecha
 *  comparte esta misma entrada de caché con el detalle del evento. */
export const fetchUserLiked = async (
  eventId: string,
  userId: string,
): Promise<boolean> => {
  "use cache";
  cacheLife({ expire: 300, stale: 60, revalidate: 60 });
  cacheTag(`event-interaction-${userId}-${eventId}`);
  const { eventInteractionsService } = createServerContainer();
  const interaction = await eventInteractionsService.getByEventAndUser(eventId, userId);
  return !!interaction?.liked;
};

export const fetchUserRegistered = async (
  eventId: string,
  userId: string,
  sessionId?: string,
): Promise<boolean> => {
  "use cache";
  cacheLife({ expire: 300, stale: 60, revalidate: 60 });
  cacheTag(
    sessionId
      ? `event-registration-${userId}-${eventId}-${sessionId}`
      : `event-registration-${userId}-${eventId}`,
  );
  const { eventRegistrationService } = createServerContainer();
  return await eventRegistrationService.isUserRegistered(eventId, userId, sessionId);
};
